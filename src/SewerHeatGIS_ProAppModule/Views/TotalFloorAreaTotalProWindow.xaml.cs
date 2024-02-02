using System;
using System.Windows.Controls;

namespace SewerHeatGIS_ProAppModule.Views
{
    /// <summary>
    /// Interaction logic for TotalFloorAreaTotalProWindow.xaml
    /// </summary>
    public partial class TotalFloorAreaTotalProWindow : ArcGIS.Desktop.Framework.Controls.ProWindow
    {
        private TotalFloorAreaTotalViewModel _vm = new TotalFloorAreaTotalViewModel();
        public TotalFloorAreaTotalProWindow()
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

        private void settingFilePathTotalFloorAreaTextbox_LostFocus(object sender, System.Windows.RoutedEventArgs e)
        {
            TextBox textbox = (TextBox)sender;
        }

        private void ProWindow_Closed(object sender, EventArgs e)
        {
            _vm.WindowClosed();
        }

        private void ProWindow_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
        }
    }
}
