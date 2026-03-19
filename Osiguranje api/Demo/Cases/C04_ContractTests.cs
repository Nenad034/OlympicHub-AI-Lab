using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using UOS.Business.PortalTA.DTO;
using UOS.PortalTA.Tests.API.DTO;

namespace UOS.PortalTA.Tests.API.Cases
{
	[TestClass]
	public class C04_ContractTests : TestFixtureBase
	{
		static HttpClient client = new HttpClient();
		static C04_ContractTests()
		{
			client.BaseAddress = new Uri(AbsoluteAPIPath);
			client.DefaultRequestHeaders.Accept.Clear();
			client.DefaultRequestHeaders.Accept.Add(
				new MediaTypeWithQualityHeaderValue("application/json"));
		}

		private static Random random = new Random();
		private string RandomString(int length)
		{
			const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
			return new string(Enumerable.Repeat(chars, length)
				.Select(s => s[random.Next(s.Length)]).ToArray());
		}

		private TravelContractDTO NewTravelContractDTO()
		{
			TravelContractDTO travelContract = new TravelContractDTO()
			{
				Id = 0,
				Number = RandomString(10),
				TravelRoutePoints = new List<TravelRoutePointDTO>(),
				NewContracts = new List<TravelContractDTO>(),
				Passengers = new List<PassengerDTO>() { new PassengerDTO() { Name = "QuidditaTest" } },
				ContractDate = new DateTime(2020, 03, 22, 12, 00, 00),
				ContractorName = "QuidditaTest",
				TravelStartDate = new DateTime(2020, 03, 25, 12, 00, 00),
				TravelEndDate = new DateTime(2020, 03, 28, 12, 00, 00),
				DeparturePlace = "Beograd",
				DestinationPlace = "Pariz",
				TravelContractValueInCurrency = 250,
				TravelContractValueInRSD = 32000,
				NumberOfPassengers = 1,
				DepartureCountryId = 1,
				DestinationCountryId = 62,
				TravelContractValueCurrencyId = 2,
				ContractStatusId = 1,
			};

			return travelContract;
		}

		[TestMethod]
		public async Task T01_TestGetTravelContractsMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			HttpResponseMessage response = await client.PostAsync("GetTravelContracts", ToJson(new { }));

			//HttpResponseMessage response = await client.PostAsync("GetTravelContracts", ToJson(new TravelContractFilterDTO()
			//{
			//	ContractorEmailAddressContains = "@gmail.com",
			//	ContractStatusIdEquals = 1,
			//	SortCriteria = new List<SortDTO>() {
			//		new SortDTO() { Name = "ContractorName", Asc = true },
			//		new SortDTO() { Name = "ContractorEmailAddress", Asc = false },
			//		new SortDTO() { Name = "asc", Asc = false },
			//	}
			//}));

			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
		}

		[TestMethod]
		public async Task T02_TestGetTravelContractMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			HttpResponseMessage response = await client.PostAsync("GetTravelContracts", ToJson(new { }));
			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			var contracts = Newtonsoft.Json.JsonConvert.DeserializeObject<List<TravelContractDTO>>(result);
			if (contracts.Any())
			{
				long id = contracts.Select(x => x.Id).First();
				response = await client.GetAsync("GetTravelContract/" + id);
				Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

				result = await response.Content.ReadAsStringAsync();
				Console.WriteLine(result);

				var contract = Newtonsoft.Json.JsonConvert.DeserializeObject<TravelContractDTO>(result);
				Assert.IsTrue(contract.Id == id);
			}
		}

		[TestMethod]
		public async Task T03_TestSaveTravelContractMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			TravelContractDTO travelContract = NewTravelContractDTO();
			HttpResponseMessage response = await client.PostAsync("SaveTravelContract", ToJson(travelContract));
			Assert.IsTrue(response.StatusCode == HttpStatusCode.Created);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);

			Assert.IsTrue(result.Contains(travelContract.Number));
		}

		[TestMethod]
		public async Task T04_TestConcludeContractAndUpdateGuaranteeNumber()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			TravelContractDTO travelContract = NewTravelContractDTO();
			travelContract.TravelGuaranteeCertificateNumber = "04-0000000017" + RandomString(5);
			travelContract.TravelGuaranteeCertificateDate = DateTime.Now;

			HttpResponseMessage response = await client.PostAsync("ConcludeContractAndUpdateGuaranteeNumber", ToJson(travelContract));

			Assert.IsTrue(response.StatusCode == HttpStatusCode.Created);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
			Assert.IsTrue(result.Contains(travelContract.Number));
			Assert.IsTrue(result.Contains("Zaključen"));
		}

		[TestMethod]
		public async Task T05_TestConcludeTravelContractMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			TravelContractDTO travelContract = NewTravelContractDTO();
			HttpResponseMessage contractSaveResponse = await client.PostAsync("SaveTravelContract", ToJson(travelContract));

			string contractSaveResult = await contractSaveResponse.Content.ReadAsStringAsync();
			long id = Newtonsoft.Json.JsonConvert.DeserializeObject<TravelContractDTO>(contractSaveResult).Id;

			HttpResponseMessage response = await client.PostAsync("ConcludeTravelContract", ToJson(new { Id = id }));

			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);

			Assert.IsTrue(result.Contains("Zaključen"));
		}

		[TestMethod]
		public async Task T06_TestReverseTravelContractMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			TravelContractDTO travelContract = NewTravelContractDTO();
			HttpResponseMessage contractSaveResponse = await client.PostAsync("SaveTravelContract", ToJson(travelContract));

			string contractSaveResult = await contractSaveResponse.Content.ReadAsStringAsync();
			long id = Newtonsoft.Json.JsonConvert.DeserializeObject<TravelContractDTO>(contractSaveResult).Id;

			HttpResponseMessage responseConcluded = await client.PostAsync("ConcludeTravelContract", ToJson(new { Id = id }));
			travelContract.CancellationReasonId = 1;
			travelContract.Id = id;
			HttpResponseMessage response = await client.PostAsync("ReverseTravelContract", ToJson(travelContract));

			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
			Assert.IsTrue(result.Contains("Storniran"));
		}

		[TestMethod]
		public async Task T07_TestConcludeAndCancelReplacedTravelContractMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			// Save new contract
			TravelContractDTO travelContract = NewTravelContractDTO();
			HttpResponseMessage contractSaveResponse = await client.PostAsync("SaveTravelContract", ToJson(travelContract));
			string contractSaveResult = await contractSaveResponse.Content.ReadAsStringAsync();
			long id = Newtonsoft.Json.JsonConvert.DeserializeObject<TravelContractDTO>(contractSaveResult).Id;

			// Conclude new contract
			HttpResponseMessage response = await client.PostAsync("ConcludeTravelContract", ToJson(new { Id = id }));
			string result = await response.Content.ReadAsStringAsync();

			// Create replacement contract
			TravelContractDTO newTravelContract = NewTravelContractDTO();
			newTravelContract.ReplacedContractId = id;
			newTravelContract.DestinationPlace = "Strasbourg";

			// Save replacement contract
			HttpResponseMessage contractSaveResponseNew = await client.PostAsync("SaveTravelContract", ToJson(newTravelContract));
			string contractSaveResultNew = await contractSaveResponseNew.Content.ReadAsStringAsync();

			// Conclude replacment contract - replaced contract becomes cancelled.
			long idNewContract = Newtonsoft.Json.JsonConvert.DeserializeObject<TravelContractDTO>(contractSaveResultNew).Id;
			HttpResponseMessage responseContractReplacement = await client.PostAsync("ConcludeTravelContract", ToJson(new { Id = idNewContract }));

			string resultReplace = await response.Content.ReadAsStringAsync();

			Assert.IsTrue(resultReplace.Contains(id.ToString()));
			Assert.IsTrue(resultReplace.Contains("Zaključen"));
			Assert.IsTrue(responseContractReplacement.StatusCode == HttpStatusCode.OK);
		}

		[TestMethod]
		public async Task T07_TestDeleteTravelContractMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			TravelContractDTO travelContract = NewTravelContractDTO();
			HttpResponseMessage contractSaveResponse = await client.PostAsync("SaveTravelContract", ToJson(travelContract));

			string contractSaveResult = await contractSaveResponse.Content.ReadAsStringAsync();
			long id = Newtonsoft.Json.JsonConvert.DeserializeObject<TravelContractDTO>(contractSaveResult).Id;

			HttpResponseMessage response = await client.PostAsync("DeleteTravelContract", ToJson(new { Id = id, Version = 1 }));

			Assert.IsTrue(response.StatusCode == HttpStatusCode.NoContent);
		}

		[TestMethod]
		public async Task T08_TestGetTravelGuaranteePDFMethod()
		{
			string token = await CreateToken(client, UserContext.TravelAgencyAPIUser);
			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			TravelContractDTO travelContract = NewTravelContractDTO();
			HttpResponseMessage contractSaveResponse = await client.PostAsync("SaveTravelContract", ToJson(travelContract));

			string contractSaveResult = await contractSaveResponse.Content.ReadAsStringAsync();
			long id = Newtonsoft.Json.JsonConvert.DeserializeObject<TravelContractDTO>(contractSaveResult).Id;

			HttpResponseMessage response = await client.PostAsync("ConcludeTravelContract", ToJson(new { Id = id }));

			response = await client.GetAsync("GetTravelGuaranteePDF/" + id);

			Assert.IsTrue(response.StatusCode == HttpStatusCode.OK);

			string result = await response.Content.ReadAsStringAsync();
			result = result.Replace("\"", "");
			File.WriteAllBytes("Test.pdf", Convert.FromBase64String(result));
		}
	}
}
