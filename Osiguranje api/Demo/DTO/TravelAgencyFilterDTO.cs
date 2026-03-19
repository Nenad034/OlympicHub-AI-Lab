using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UOS.Business.PortalTA.DTO
{
	/// <summary>
	/// Grouping fields for filtering and sorting travel agency results.
	/// </summary>
	public class TravelAgencyFilterDTO
	{
		/// <summary>
		/// If field is not empty return only travel agencies where Name contains text specified in this field.
		/// </summary>
		public string NameContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel agencies where City contains text specified in this field.
		/// </summary>
		public string CityContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel agencies where Address contains text specified in this field.
		/// </summary>
		public string AddressContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel agencies where ZipCode contains text specified in this field.
		/// </summary>
		public string ZipCodeContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel agencies where LicenseNumber contains text specified in this field.
		/// </summary>
		public string LicenseNumberContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel agencies where IdentificationNumber contains text specified in this field.
		/// </summary>
		public string IdentificationNumberContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel agencies where TaxIdentificationNumber contains text specified in this field.
		/// </summary>
		public string TaxIdentificationNumberContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel agencies where ContactEmailAddress contains text specified in this field.
		/// </summary>
		public string ContactEmailAddressContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel agencies where NotificationEmailAddress contains text specified in this field.
		/// </summary>
		public string NotificationEmailAddressContains { get; set; }
		/// <summary>
		/// If field is not empty return only travel agencies where ContactPhones contains text specified in this field.
		/// </summary>
		public string ContactPhonesContains { get; set; }
		/// <summary>
		/// If field is not empty return only active or inactive travel agencies, depending on field value.
		/// </summary>
		public bool? ActiveOnly { get; set; }

		/// <summary>
		/// If field is not empty return only travel agencies where CreatedById is equal with value in this field.
		/// </summary>
		public long? CreatedByIdEquals { get; set; }
		/// <summary>
		/// If field is not empty return only travel agencies where LastChangedById is equal with value in this field.
		/// </summary>
		public long? LastChangedByIdEquals { get; set; }
		/// <summary>
		/// <para>Seach options though which result pagging and sorting is supported.</para>
		/// </summary>
		public SearchOptionsDTO SeachOptions { get; set; }
	}
}
