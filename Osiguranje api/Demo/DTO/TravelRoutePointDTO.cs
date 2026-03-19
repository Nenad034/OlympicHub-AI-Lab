using System;

namespace UOS.Business.PortalTA.DTO
{
	///<summary>
	/// TravelRoutePoint Data Transfer Object.
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
	public partial class TravelRoutePointDTO
	{
		public long Id { get; set; }
		public int? Version { get; set; }

		#region Generated Properties

		/// <summary>
		/// Date when passengers arrive at this destination (route point).
		/// </summary>

		public DateTime? FromDate { get; set; }

		/// <summary>
		/// Date when passengers leave this destination (route point).
		/// </summary>
		
		public DateTime? ToDate { get; set; }

		/// <summary>
		/// Place, route point location.
		/// </summary>
		
		public string Place { get; set; }

		/// <summary>
		/// Country of this route point.
		/// Id of associated object.
		/// </summary>
		public long? CountryId { get; set; }

		/// <summary>
		/// Travel contract on which this route point is defined.
		/// Id of associated object.
		/// </summary>
		public long? TravelContractId { get; set; }

		#endregion Generated Properties
	}
}