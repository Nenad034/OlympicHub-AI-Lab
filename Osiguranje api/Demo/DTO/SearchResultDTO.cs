using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UOS.Business.PortalTA.DTO
{
	/// <summary>
	/// Extending list of items with additional pagging fields.
	/// </summary>
	/// <typeparam name="T">Concrete item type that represents result.</typeparam>
	public class SearchResultDTO<T>
	{
		/// <summary>
		/// Records found in the system which fulfils given search criteria, paged according to given parameters.
		/// </summary>
		public IList<T> ResultSet { get; set; }

		/// <summary>
		/// Total number of the records returned in the ResultSet.
		/// </summary>
		public int ResultSetCount { get; set; }

		/// <summary>
		/// Total number of records found in the system that fulfils given search criteria (without paging).
		/// </summary>
		public int TotalCount { get; set; }

		/// <summary>
		/// Number of the page for which the results are returned. Page numbers starts from 1. 
		/// </summary>
		public int PageNumber { get; set; }

		/// <summary>
		/// <para>Number of the records on one page.</para>
		/// <para>This is the same value as <see cref="PageSize"/> if it is supplied within <see cref="SearchOptionsDTO"/>, otherwise the default value is used.</para>
		/// </summary>
		public int PageSize { get; set; }
	}
}
