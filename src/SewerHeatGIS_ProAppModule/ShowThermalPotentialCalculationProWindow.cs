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
    internal class ShowThermalPotentialCalculationProWindow : Button
    {
        private ThermalPotentialCalculationProWindow _thermalpotentialcalculationprowindow = null;

        protected override void OnClick()
        {
            //already open?
            if (_thermalpotentialcalculationprowindow != null)
                return;
            _thermalpotentialcalculationprowindow = new ThermalPotentialCalculationProWindow();
            _thermalpotentialcalculationprowindow.Owner = FrameworkApplication.Current.MainWindow;
            _thermalpotentialcalculationprowindow.Closed += (o, e) => { _thermalpotentialcalculationprowindow = null; };
            _thermalpotentialcalculationprowindow.ShowDialog();
        }
    }
}
