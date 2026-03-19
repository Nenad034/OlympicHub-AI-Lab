using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using UOS.Business.PortalTA.DTO;
using UOS.PortalTA.Tests.API.DTO;

namespace UOS.PortalTA.Tests.API.Cases
{
	[TestClass]
	public class C02_CodebookTests : TestFixtureBase
	{
		static HttpClient client = new HttpClient();

		static C02_CodebookTests()
		{
			client.BaseAddress = new Uri(AbsoluteAPIPath);
			client.DefaultRequestHeaders.Accept.Clear();
			client.DefaultRequestHeaders.Accept.Add(
				new MediaTypeWithQualityHeaderValue("application/json"));
		}

		[TestMethod]
		public async Task T01_TestGetCountriesMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			HttpResponseMessage response = await client.GetAsync("GetCountries");
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
		}

		[TestMethod]
		public async Task T02_TestGetCountryMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			HttpResponseMessage response = await client.GetAsync("GetCountry/1");
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
		}

		[TestMethod]
		public async Task T03_TestGetCurrenciesMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			HttpResponseMessage response = await client.GetAsync("GetCurrencies");
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
		}

		[TestMethod]
		public async Task T04_TestGetCurrencyMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			HttpResponseMessage response = await client.GetAsync("GetCurrency/1");
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
		}

		[TestMethod]
		public async Task T05_TestGetTravelCancellationReasonsMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			HttpResponseMessage response = await client.GetAsync("GetTravelCancellationReasons");
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
		}

		[TestMethod]
		public async Task T06_TestGetTravelCancellationReasonMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			HttpResponseMessage response = await client.GetAsync("GetTravelCancellationReason/1");
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
		}

		[TestMethod]
		public async Task T07_TestGetTravelContractStatusMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			HttpResponseMessage response = await client.GetAsync("GetTravelContractStatus");
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
		}

		[TestMethod]
		public async Task T08_TestGetTravelAgenciesMethod()
		{
			string token = await CreateToken(client, UserContext.InsuranceCompanyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			// get all agencies
			HttpResponseMessage response = await client.PostAsync("GetTravelAgencies", ToJson(new {}));
			string result = await response.Content.ReadAsStringAsync();
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			// filter agencies
			response = await client.PostAsync("GetTravelAgencies", ToJson(new TravelAgencyFilterDTO() { NameContains = "PREDUZEĆE", CityContains = "Београд-Савски Венац" }));
			result = await response.Content.ReadAsStringAsync();
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			// sort agencies
			response = await client.PostAsync("GetTravelAgencies", ToJson(
				new TravelAgencyFilterDTO(){
					SeachOptions = new SearchOptionsDTO() {
						SortCriteria = new List<SortDTO> { new SortDTO() { Name = "Id", Asc = true } }
					}
				}));
			result = await response.Content.ReadAsStringAsync();
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			// page agencies
			response = await client.PostAsync("GetTravelAgencies", ToJson(
				new TravelAgencyFilterDTO()
				{
					SeachOptions = new SearchOptionsDTO()
					{
						SortCriteria = new List<SortDTO> { new SortDTO() { Name = "Id", Asc = true } },
						//PageNumber = 2,
						PageSize = 15
					}
				}));
			result = await response.Content.ReadAsStringAsync();
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			// page agencies
			response = await client.PostAsync("GetTravelAgencies", ToJson(
				new TravelAgencyFilterDTO()
				{
					SeachOptions = new SearchOptionsDTO()
					{
						SortCriteria = new List<SortDTO> { new SortDTO() { Name = "Id", Asc = true } },
						PageNumber = 50,
						PageSize = 20
					}
				}));
			result = await response.Content.ReadAsStringAsync();
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			Console.WriteLine(result);
		}

		[TestMethod]
		public async Task T09_TestGetGetTravelAgencyMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			HttpResponseMessage response = await client.GetAsync("GetTravelAgency/1");
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
		}
	}
}
