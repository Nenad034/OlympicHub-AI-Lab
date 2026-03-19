using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace UOS.PortalTA.Tests.API
{
	// just for test - remove this entity for integration
	public enum UserContext
	{
		InsuranceCompanyAPIUser,
		TravelAgencyAPIUser,
	}

	public abstract class TestFixtureBase
	{
		public static string AbsoluteAPIPath = "http://localhost/UOS.Integration.API/api/";

		// just for test - remove this field for integration
		private static readonly IDictionary<UserContext, KeyValuePair<string, string>> testCredentials = new Dictionary<UserContext, KeyValuePair<string, string>>()
		{
			{ UserContext.InsuranceCompanyAPIUser, new KeyValuePair<string, string>("OsiguravacAPI", "Test.123!") },
			{ UserContext.TravelAgencyAPIUser, new KeyValuePair<string, string>("TuristickaAgencijaAPI", "Test.123!") },
		};

		// just for test - remove this field for integration
		// comment constructor for local testing
		//static TestFixtureBase()
		//{
		//	testCredentials[UserContext.InsuranceCompanyAPIUser] = new KeyValuePair<string, string>("qdunav.api", "Qapi.123");
		//	testCredentials[UserContext.TravelAgencyAPIUser] = new KeyValuePair<string, string>("qargus.api", "Qapi.123");

		//	AbsoluteAPIPath = "https://testapi.udruzenje-osiguravaca-srbije.com/api/";
		//}

		// just for test - remove this method for integration
		public async Task<string> CreateToken(HttpClient client, UserContext context)
		{
			var kvp = testCredentials[context];
			return await CreateToken(client, kvp.Key, kvp.Value);
		}

		public async Task<string> CreateToken(HttpClient client, string username, string password)
		{
			HttpResponseMessage response = await client.PostAsync("CreateToken",
				ToJson(new
				{
					username,
					password
				}));

			string result = await response.Content.ReadAsStringAsync();
			return result.Replace("\"", "");
		}

		protected HttpContent ToJson(object value)
		{
			string json = Newtonsoft.Json.JsonConvert.SerializeObject(value);
			var stringContent = new StringContent(json, UnicodeEncoding.UTF8, "application/json");
			return stringContent;
		}
	}
}
