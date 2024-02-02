using ArcGIS.Desktop.Core.Geoprocessing;
using ArcGIS.Desktop.Framework.Threading.Tasks;
using ArcGIS.Desktop.Mapping;
using System;
using System.Linq;
using System.Windows;
using System.Windows.Controls;

namespace SewerHeatGIS_ProAppModule.Views
{
    /// <summary>
    /// Interaction logic for HeatDemandCalculationProWindow.xaml
    /// </summary>
    public partial class HeatDemandCalculationProWindow : ArcGIS.Desktop.Framework.Controls.ProWindow
    {
        private HeatDemandCalculationViewModel _vm = new HeatDemandCalculationViewModel();
        public HeatDemandCalculationProWindow()
        {
            InitializeComponent();
            this.DataContext = _vm;
            _vm.ClosingRequest += CloseDialog;
        }

        /// <summary>
        /// ウィンドウを閉じる
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void CloseDialog(object sender, EventArgs e)
        {
            this.Close();
        }

        private void settingFilePathTextbox_LostFocus(object sender, RoutedEventArgs e)
        {
            TextBox textbox = (TextBox)sender;
            _ = _vm.CheckSettingFile(textbox.Text, false);
        }

        private void settingFilePathForBuidingsTextbox_LostFocus(object sender, RoutedEventArgs e)
        {
            TextBox textbox = (TextBox)sender;
        }

        private void ProWindow_Closed(object sender, EventArgs e)
        {
            _vm.closed = true;
        }

        private void ProWindow_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            //確認ダイアログが必要になれば追加する
        }
    }
}
