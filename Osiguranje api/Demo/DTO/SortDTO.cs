using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UOS.Business.PortalTA.DTO
{
	/// <summary>
	/// Defined ascending or descending sort order by entity field name.
	/// </summary>
	public class SortDTO
	{
		/// <summary>
		/// Results will be ordered by values in the field with this name.
		/// </summary>
		public string Name { get; set; }
		/// <summary>
		/// If true, results will be sorted in ascending order.
		/// If false, results will be sorted in descending order.
		/// </summary>
		public bool Asc { get; set; }
	}
}
