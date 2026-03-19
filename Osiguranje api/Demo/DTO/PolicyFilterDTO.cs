using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UOS.Business.PortalTA.DTO
{
	/// <summary>
	/// Grouping fields for filtering and sorting policy results.
	/// </summary>
	public class PolicyFilterDTO
	{
		/// <summary>
		/// If field is not empty return only policies where Number contains text specified in this field.
		/// </summary>
		public string NumberContains { get; set; }
		/// <summary>
		/// If field is not empty return only policies where ProductAndTariff contains text specified in this field.
		/// </summary>
		public string ProductAndTariffContains { get; set; }
		/// <summary>
		/// If field is not empty return only policies where SumInsured_EUR is equal with value in this field.
		/// </summary>
		public int? SumInsured_EUREquals { get; set; }
		/// <summary>
		/// If field is not empty return only policies where InsuranceStartDate is greater or equal to date specified in this field.
		/// </summary>
		public DateTime? InsuranceStartDateFrom { get; set; }
		/// <summary>
		/// If field is not empty return only policies where InsuranceStartDate is less or equal to date specified in this field.
		/// </summary>
		public DateTime? InsuranceStartDateTo { get; set; }
		/// <summary>
		/// If field is not empty return only policies where InsuranceEndDate is greater or equal to date specified in this field.
		/// </summary>
		public DateTime? InsuranceEndDateFrom { get; set; }
		/// <summary>
		/// If field is not empty return only policies where InsuranceEndDate is less or equal to date specified in this field.
		/// </summary>
		public DateTime? InsuranceEndDateTo { get; set; }
		/// <summary>
		/// If field is not empty return only policies where NumberOfPassengers is equal with value in this field.
		/// </summary>
		public int? NumberOfPassengersEquals { get; set; }
		/// <summary>
		/// If field is not empty return only policies where SumInsured_EUR is equal with value in this field.
		/// </summary>
		public int? NumberOfPassengersCancellationEquals { get; set; }
		/// <summary>
		/// If field is not empty return only policies where InsuranceCompanyId is equal with value in this field.
		/// </summary>
		public long? InsuranceCompanyIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only policies where TravelAgencyId is equal with value in this field.
		/// </summary>
		public long? TravelAgencyIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only policies where LicenseCategoryId is equal with value in this field.
		/// </summary>
		public long? LicenseCategoryIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only policies where CreatedById is equal with value in this field.
		/// </summary>
		public long? CreatedByIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only policies where LastChangedById is equal with value in this field.
		/// </summary>
		public long? LastChangedByIdEquals { get; set; }
		/// <summary>
		/// <para>Seach options though which result pagging and sorting is supported.</para>
		/// </summary>
		public SearchOptionsDTO SeachOptions { get; set; }
	}
}
