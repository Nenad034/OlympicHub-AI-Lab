using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using UOS.PortalTA.Tests.API.DTO;

namespace UOS.PortalTA.Tests.API.Cases
{
	[TestClass]
	public class C03_PolicyTests : TestFixtureBase
	{
		static HttpClient client = new HttpClient();

		static C03_PolicyTests()
		{
			client.BaseAddress = new Uri(AbsoluteAPIPath);
			client.DefaultRequestHeaders.Accept.Clear();
			client.DefaultRequestHeaders.Accept.Add(
				new MediaTypeWithQualityHeaderValue("application/json"));
		}

		[TestMethod]
		public async Task T01_TestGetPoliciesMethod()
		{
			string token = await CreateToken(client, UserContext.InsuranceCompanyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			HttpResponseMessage response = await client.PostAsync("GetPolicies", ToJson(new { }));
			//HttpResponseMessage response = await client.PostAsync("GetPolicies", ToJson(new PolicyFilterDTO() { NumberContains = "990000031301", SumInsured_EUREquals = 300000 }));

			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
		}

		[TestMethod]
		public async Task T02_TestGetPolicyMethod()
		{
			string token = await CreateToken(client, UserContext.InsuranceCompanyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			HttpResponseMessage response = await client.PostAsync("GetPolicies", ToJson(new { }));
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			var policyList = JsonConvert.DeserializeObject<List<PolicyDTO>>(result);

			if (policyList.Any())
			{
				long id = policyList.Select(x => x.Id).First();
				response = await client.GetAsync("GetPolicy/" + id);
				Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

				result = await response.Content.ReadAsStringAsync();
				Console.WriteLine(result);

				var policy = Newtonsoft.Json.JsonConvert.DeserializeObject<PolicyDTO>(result);
				Assert.IsTrue(policy.Id == id);
			}
		}

		[TestMethod]
		public async Task T03_TestSaveAndDeletePolicyMethods()
		{
			string token = await CreateToken(client, UserContext.InsuranceCompanyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			PolicyDTO policy = new PolicyDTO()
			{
				Id = 0,
				InsuranceCompanyId = 3,
				InsuranceStartDate = new DateTime(2001, 03, 24, 23, 59, 59),
				InsuranceEndDate = new DateTime(2002, 03, 04, 00, 00, 00),
				Number = "123456",
				ProductAndTariff = "Proizvod i tarifa!",
				SumInsured_EUR = 2000000,
				TravelAgencyId = 16,
				NumberOfPassengers = 0,
				NumberOfPassengersCancellation = 0
			};

			HttpResponseMessage response = await client.PostAsync("SavePolicy", ToJson(policy));

			Assert.IsTrue(response.StatusCode == HttpStatusCode.Created);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);

			var savedPolicy = Newtonsoft.Json.JsonConvert.DeserializeObject<PolicyDTO>(result);

			HttpResponseMessage deleteResponse = await client.PostAsync("DeletePolicy", ToJson(new { Id = savedPolicy.Id }));
			Assert.IsNotNull(deleteResponse);
			Assert.IsTrue(deleteResponse.StatusCode == HttpStatusCode.NoContent);
		}
	}
}
