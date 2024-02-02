using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace SewerHeatGIS_ProAppModule.Views
{
    /// <summary>
    /// Interaction logic for ThermalPotentialCalculationProWindow.xaml
    /// </summary>
    public partial class ThermalPotentialCalculationProWindow : ArcGIS.Desktop.Framework.Controls.ProWindow
    {
        private ThermalPotentialCalculationViewModel _vm = new ThermalPotentialCalculationViewModel();
        public ThermalPotentialCalculationProWindow()
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
        }

        private void ProWindow_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            _vm.closed = true;
        }

        private void ProWindow_Closed(object sender, EventArgs e)
        {
            //確認ダイアログが必要になれば追加する
        }
    }
}
