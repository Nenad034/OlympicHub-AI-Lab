using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UOS.Business.PortalTA.DTO
{
	/// <summary>
	/// Search options for this search, grouping pagination and sorting possibilities.
	/// </summary>
	public class SearchOptionsDTO
	{
		/// <summary>
		/// <para>Number of the page for which the results should be returned. </para>
		/// <para>Page numbers starts from 1. If not supplied, the default value 1 is used.</para>
		/// </summary>
		public int? PageNumber { get; set; }

		/// <summary>
		/// <para>Number of the records per one page – this is used to limit result set according to the page size. If not supplied, the default value is used. </para>
		/// <para>Note that result sets are limited in order to improve the system performance and can be changed in time, so it is recommended to supply this parameter.</para>
		/// </summary>
		public int? PageSize { get; set; }

		/// <summary>
		/// <para> Defines list of sort order criterias that can be used to sort results. </para>
		/// <para> Sort criterias are chained one by one in order that is specified in this list. </para>
		/// </summary>
		public List<SortDTO> SortCriteria { get; set; }
	}
}
