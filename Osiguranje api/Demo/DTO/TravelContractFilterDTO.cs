using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UOS.Business.PortalTA.DTO
{
	/// <summary>
	/// Grouping fields for filtering and sorting travel contract results.
	/// </summary>
	public class TravelContractFilterDTO
	{
		/// <summary>
		/// If field is not empty return only travel contracts where Number contains text specified in this field.
		/// </summary>
		public string NumberContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where UniqueNumber contains text specified in this field.
		/// </summary>
		public string UniqueNumberContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where ContractDate is greater or equal to date specified in this field.
		/// </summary>
		public DateTime? ContractDateFrom { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where ContractDate is less or equal to date specified in this field.
		/// </summary>
		public DateTime? ContractDateTo { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where TravelGuaranteeCertificateNumber contains text specified in this field.
		/// </summary>
		public string TravelGuaranteeCertificateNumberContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where TravelGuaranteeCertificateDate is greater or equal to date specified in this field.
		/// </summary>
		public DateTime? TravelGuaranteeCertificateDateFrom { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where TravelGuaranteeCertificateDate is less or equal to date specified in this field.
		/// </summary>
		public DateTime? TravelGuaranteeCertificateDateTo { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where ContractorName contains text specified in this field.
		/// </summary>
		public string ContractorNameContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where ContractorIdentificationNumber contains text specified in this field.
		/// </summary>
		public string ContractorIdentificationNumberContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where ContractorDateOfBirth is greater or equal to date specified in this field.
		/// </summary>
		public DateTime? ContractorDateOfBirthFrom { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where ContractorDateOfBirth is less or equal to date specified in this field.
		/// </summary>
		public DateTime? ContractorDateOfBirthTo { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where ContractorEmailAddress contains text specified in this field.
		/// </summary>
		public string ContractorEmailAddressContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where TravelStartDate is greater or equal to date specified in this field.
		/// </summary>
		public DateTime? TravelStartDateFrom { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where TravelStartDate is less or equal to date specified in this field.
		/// </summary>
		public DateTime? TravelStartDateTo { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where TravelEndDate is greater or equal to date specified in this field.
		/// </summary>
		public DateTime? TravelEndDateFrom { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where TravelEndDate is less or equal to date specified in this field.
		/// </summary>
		public DateTime? TravelEndDateTo { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where DeparturePlace contains text specified in this field.
		/// </summary>
		public string DeparturePlaceContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where DestinationPlace contains text specified in this field.
		/// </summary>
		public string DestinationPlaceContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where TravelContractValueInCurrency is equal with value in this field.
		/// </summary>
		public decimal? TravelContractValueInCurrencyEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where TravelContractValueInRSD is equal with value in this field.
		/// </summary>
		public decimal? TravelContractValueInRSDEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where NumberOfPassengers is equal with value in this field.
		/// </summary>
		public int? NumberOfPassengersEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where PolicyId is equal with value in this field.
		/// </summary>
		public long? PolicyIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where InsuranceCompanyId is equal with value in this field.
		/// </summary>
		public long? InsuranceCompanyIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where TravelAgencyId is equal with value in this field.
		/// </summary>
		public long? TravelAgencyIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where DepartureCountryId is equal with value in this field.
		/// </summary>
		public long? DepartureCountryIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where DestinationCountryId is equal with value in this field.
		/// </summary>
		public long? DestinationCountryIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where TravelContractValueCurrencyId is equal with value in this field.
		/// </summary>
		public long? TravelContractValueCurrencyIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where ReplacedContractId is equal with value in this field.
		/// </summary>
		public long? ReplacedContractIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where ContractStatusId is equal with value in this field.
		/// </summary>
		public long? ContractStatusIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where CancellationReasonId is equal with value in this field.
		/// </summary>
		public long? CancellationReasonIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where CreatedById is equal with value in this field.
		/// </summary>
		public long? CreatedByIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel contracts where LastChangedById is equal with value in this field.
		/// </summary>
		public long? LastChangedByIdEquals { get; set; }

		/// <summary>
		/// <para>Seach options though which result pagging and sorting is supported.</para>
		/// </summary>
		public SearchOptionsDTO SeachOptions { get; set; }
	}
}
