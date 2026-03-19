using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace UOS.PortalTA.Tests.API.Cases
{
	[TestClass]
	public class C01_ActionTests : TestFixtureBase
	{
		static HttpClient client = new HttpClient();

		static C01_ActionTests()
		{
			client.BaseAddress = new Uri(AbsoluteAPIPath + "test/");
			client.DefaultRequestHeaders.Accept.Clear();
			client.DefaultRequestHeaders.Accept.Add(
				new MediaTypeWithQualityHeaderValue("application/json"));
		}

		[TestMethod]
		public async Task T01_TestGetMethod()
		{
			HttpResponseMessage response = await client.GetAsync("Get");

			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);
			Assert.IsTrue(response.IsSuccessStatusCode);

			string result = await response.Content.ReadAsStringAsync();
			Assert.IsTrue(result == "[\"Quiddita\",\"One\"]");
		}

		[TestMethod]
		public async Task T02_TestGetMethodWithParam()
		{
			HttpResponseMessage response = await client.GetAsync("Get/1");

			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);
			Assert.IsTrue(response.IsSuccessStatusCode);

			string result = await response.Content.ReadAsStringAsync();
			Assert.IsTrue(result == "\"Quiddita(1)\"");
		}

		[TestMethod]
		public async Task T03_TestJsonPostMethod()
		{
			HttpResponseMessage response = await client.PostAsync("Post", 
				ToJson(new { Param1 = "value1" }));

			Assert.IsTrue(response.StatusCode == HttpStatusCode.Created);
			Assert.IsTrue(response.IsSuccessStatusCode);

			string result = await response.Content.ReadAsStringAsync();
			var values = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(result);
			Assert.IsTrue(values["Param1"] == "value1");
		}

		[TestMethod]
		public async Task T04_TestPutMethod1()
		{
			HttpResponseMessage response = await client.PutAsync("Put",
				ToJson(new { Id = 0, Param1 = "value1" }));

			Assert.IsTrue(response.StatusCode == HttpStatusCode.Created);
			Assert.IsTrue(response.IsSuccessStatusCode);

			string result = await response.Content.ReadAsStringAsync();
			var values = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(result);
			Assert.IsTrue(values["Param1"] == "value1");
		}

		[TestMethod]
		public async Task T05_TestPutMethod2()
		{
			HttpResponseMessage response = await client.PutAsync("Put",
				ToJson(new { Id = 1, Param1 = "value1"} ));

			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);
			Assert.IsTrue(response.IsSuccessStatusCode);

			string result = await response.Content.ReadAsStringAsync();
			var values = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(result);
			Assert.IsTrue(values["Param1"] == "value1");
		}

		[TestMethod]
		public async Task T06_TestDeleteMethod()
		{
			HttpResponseMessage response = await client.DeleteAsync("Delete/1");

			Assert.IsTrue(response.StatusCode == HttpStatusCode.NoContent);
			Assert.IsTrue(response.IsSuccessStatusCode);
		}

		[TestMethod]
		public async Task T07_TestValidationError()
		{
			HttpResponseMessage response = await client.GetAsync("Get/400");

			Assert.IsTrue(response.StatusCode == HttpStatusCode.BadRequest);
			Assert.IsTrue(!response.IsSuccessStatusCode);

			string result = await response.Content.ReadAsStringAsync();
			var values = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(result);
			string type = values["ExceptionType"]; // EX Type, validation, access denined, server, etc.
			string details = values["ExceptionMessage"]; // object with exception details

			Assert.IsTrue(details.Contains("Validation exception"));

			// details are JSON object with general message field and data array[].
			// data is array of validation messages in format of {'field', 'message'}. Field is empty for general validation
		}

		[TestMethod]
		public async Task T08_TestNotAuthenticatedError()
		{
			HttpResponseMessage response = await client.GetAsync("Get/401");

			Assert.IsTrue(response.StatusCode == HttpStatusCode.Unauthorized);
			Assert.IsTrue(!response.IsSuccessStatusCode);

			string result = await response.Content.ReadAsStringAsync();
			var values = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(result);
			string type = values["ExceptionType"]; // EX Type, validation, access denined, server, etc.
			string details = values["ExceptionMessage"]; // object with exception details

			// details are error message.
		}

		[TestMethod]
		public async Task T09_TestNotAuthorizedError()
		{
			HttpResponseMessage response = await client.GetAsync("Get/403");

			Assert.IsTrue(response.StatusCode == HttpStatusCode.Forbidden);
			Assert.IsTrue(!response.IsSuccessStatusCode);

			string result = await response.Content.ReadAsStringAsync();
			var values = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(result);
			string type = values["ExceptionType"]; // EX Type, validation, access denined, server, etc.
			string details = values["ExceptionMessage"]; // object with exception details

			// details are error message.
		}

		[TestMethod]
		public async Task T10_TestServerError()
		{
			HttpResponseMessage response = await client.GetAsync("Get/500");

			Assert.IsTrue(response.StatusCode == HttpStatusCode.InternalServerError);
			Assert.IsTrue(!response.IsSuccessStatusCode);

			string result = await response.Content.ReadAsStringAsync();
			var values = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(result);
			string type = values["ExceptionType"]; // EX Type, validation, access denined, server, etc.
			string details = values["ExceptionMessage"]; // object with exception details

			// details are error message.
		}
	}
}
