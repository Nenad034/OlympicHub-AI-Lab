using System;

namespace UOS.PortalTA.Tests.API.DTO
{
	///<summary>
	/// Policy Data Transfer Object.
	/// </summary>
	/// <note>
	/// Data transfer objects are used for encapsulation of information carried by a business object, with the difference
	/// of not being directly related to NHibernate session, nor the underlying database representation.
	/// They belong to a class of objects often referred to as POCO (Plain Old C# Object).
	/// If you are encountering this object for the first time, please sift through the following articles
	/// before any coding on your part takes place (note the controversy on its use in our context):
	///		1) https://en.wikipedia.org/wiki/Data_transfer_object
	///		2) http://martinfowler.com/bliki/LocalDTO.html
	///</note>
	public partial class PolicyDTO
	{
		public long Id { get; set; }
		public int? Version { get; set; }

		#region Generated Properties

		/// <summary>
		/// Policy number.
		/// </summary>
		
		public string Number { get; set; }

		/// <summary>
		/// Product and tariff under which this policy is concluded.
		/// </summary>
		
		public string ProductAndTariff { get; set; }

		/// <summary>
		/// Insured sum for this licence category in EUR.
		/// </summary>
		
		public int? SumInsured_EUR { get; set; }

		/// <summary>
		/// Insurance start date.
		/// </summary>
		
		public DateTime? InsuranceStartDate { get; set; }

		/// <summary>
		/// Insurance end date.
		/// </summary>
		
		public DateTime? InsuranceEndDate { get; set; }

		/// <summary>
		/// Current number of passengers.
		/// </summary>
		
		public int? NumberOfPassengers { get; set; }

		/// <summary>
		/// Current number of passenger cancellations.
		/// </summary>
		
		public int? NumberOfPassengersCancellation { get; set; }

		/// <summary>
		/// Insureer.
		/// Id of associated object.
		/// </summary>
		public long? InsuranceCompanyId { get; set; }

		/// <summary>
		/// Travel agency insured by this Policy.
		/// Id of associated object.
		/// </summary>
		public long? TravelAgencyId { get; set; }

		/// <summary>
		/// License category for this Policy.
		/// Id of associated object.
		/// </summary>
		public long? LicenseCategoryId { get; set; }

		#endregion Generated Properties
	}
}