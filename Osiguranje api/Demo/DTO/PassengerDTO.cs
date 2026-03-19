using System;

namespace UOS.Business.PortalTA.DTO
{
	///<summary>
	/// Passenger Data Transfer Object.
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
	public partial class PassengerDTO
	{
		public long Id { get; set; }
		public int? Version { get; set; }

		#region Generated Properties

		/// <summary>
		/// Full name of passenger.
		/// Encrypted String.
		/// </summary>
		public string Name { get; set; }
		/// <summary>
		/// Personal identification number of passenger.
		/// Encrypted String.
		/// </summary>
		public string IdentificationNumber { get; set; }

		#endregion Generated Properties
	}
}