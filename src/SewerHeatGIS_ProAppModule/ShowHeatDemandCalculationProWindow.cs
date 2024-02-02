using ArcGIS.Core.CIM;
using ArcGIS.Core.Data;
using ArcGIS.Core.Geometry;
using ArcGIS.Desktop.Catalog;
using ArcGIS.Desktop.Core;
using ArcGIS.Desktop.Editing;
using ArcGIS.Desktop.Extensions;
using ArcGIS.Desktop.Framework;
using ArcGIS.Desktop.Framework.Contracts;
using ArcGIS.Desktop.Framework.Dialogs;
using ArcGIS.Desktop.Framework.Threading.Tasks;
using ArcGIS.Desktop.Layouts;
using ArcGIS.Desktop.Mapping;
using SewerHeatGIS_ProAppModule.Views;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SewerHeatGIS_ProAppModule
{
    internal class ShowHeatDemandCalculationProWindow : Button
    {
        private HeatDemandCalculationProWindow _heatDemandCalculationProWindow = null;

        protected override void OnClick()
        {
            //already open?
            if (_heatDemandCalculationProWindow != null)
                return;
            _heatDemandCalculationProWindow = new HeatDemandCalculationProWindow();
            _heatDemandCalculationProWindow.Owner = FrameworkApplication.Current.MainWindow;
            _heatDemandCalculationProWindow.Closed += (o, e) => { _heatDemandCalculationProWindow = null; };
            _heatDemandCalculationProWindow.ShowDialog();
        }
    }
}
