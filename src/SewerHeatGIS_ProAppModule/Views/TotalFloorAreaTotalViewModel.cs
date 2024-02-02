using ArcGIS.Core.Events;
using ArcGIS.Desktop.Core.Geoprocessing;
using ArcGIS.Desktop.Framework;
using ArcGIS.Desktop.Framework.Dialogs;
using ArcGIS.Desktop.Framework.Threading.Tasks;
using ArcGIS.Desktop.Mapping;
using ArcGIS.Desktop.Mapping.Events;
using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;

namespace SewerHeatGIS_ProAppModule.Views
{
    public class TotalFloorAreaTotalViewModel : INotifyPropertyChanged
    {
        private readonly string _WindwoName = "延床面積集計";
        public event EventHandler ClosingRequest;
        public event PropertyChangedEventHandler PropertyChanged = delegate { };
        private RelayCommand _SelectFileCommand = null;
        private RelayCommand _InitAreaCommand = null;
        private RelayCommand _ExecuteCommand = null;
        private RelayCommand _CloseCommand = null;
        private string _FilePath = "";
        private string _Area1 = "0";
        private string _Area2 = "0";
        private string _Area3 = "0";
        private string _Area4 = "0";
        private SubscriptionToken _eventToken = null;
        private bool closed = false;
        protected virtual void NotifyPropertyChanged([CallerMemberName] string propertyName = null)
        {
            if (PropertyChanged != null)
            {
                PropertyChanged(this, new PropertyChangedEventArgs(propertyName));
            }
        }

        public TotalFloorAreaTotalViewModel()
        {
            _SelectFileCommand = new RelayCommand(() => OnSelectFile());
            _ExecuteCommand = new RelayCommand(() => OnExecuteAsync());
            _InitAreaCommand = new RelayCommand(() => OnInitArea());
            _CloseCommand = new RelayCommand(() => OnClose());
        }

        /// <summary>
        /// 設定ファイルパス
        /// </summary>
        public string FilePath
        {
            get { return _FilePath; }
            set { _FilePath = value; NotifyPropertyChanged("FilePath"); }
        }

        /// <summary>
        /// 上流側延床面積1
        /// </summary>
        public string Area1
        {
            get { return _Area1; }
            set { _Area1 = value; NotifyPropertyChanged("Area1"); }
        }

        /// <summary>
        /// 上流側延床面積2
        /// </summary>
        public string Area2
        {
            get { return _Area2; }
            set { _Area2 = value; NotifyPropertyChanged("Area2"); }
        }

        /// <summary>
        /// 上流側延床面積3
        /// </summary>
        public string Area3
        {
            get { return _Area3; }
            set { _Area3 = value; NotifyPropertyChanged("Area3"); }
        }

        /// <summary>
        /// 上流側延床面積4
        /// </summary>
        public string Area4
        {
            get { return _Area4; }
            set { _Area4 = value; NotifyPropertyChanged("Area4"); }
        }

        /// <summary>
        /// 選択ボタンコマンド
        /// </summary>
        public ICommand SelectFile
        {
            get
            {
                return _SelectFileCommand;
            }
        }

        /// <summary>
        /// 上流延床面積値初期化ボタンコマンド
        /// </summary>
        public ICommand InitArea
        {
            get
            {
                return _InitAreaCommand;
            }
        }

        /// <summary>
        /// 管渠選択ボタンコマンド
        /// </summary>
        public ICommand Execute
        {
            get
            {
                return _ExecuteCommand;
            }
        }

        /// <summary>
        /// 終了ボタンコマンド
        /// </summary>
        public ICommand Close
        {
            get
            {
                return _CloseCommand;
            }
        }

        /// <summary>
        /// 終了処理
        /// </summary>
        private void OnClose()
        {
            ClosingRequest?.Invoke(this, new EventArgs());
        }

        /// <summary>
        /// 延床面積集計設定ファイル選択ボタンクリック
        /// </summary>
        private async void OnSelectFile()
        {
            var dialog = new OpenFileDialog();
            dialog.Filter = "テキスト文書|*.txt";

            // ダイアログを表示する
            if (dialog.ShowDialog() == true)
            {
                FilePath = dialog.FileName;
                // 選択されたファイル名 (ファイルパス) をチェックしてメッセージボックスに表示
                bool ret = await CheckSettingFile(dialog.FileName);
            }
        }

        /// <summary>
        /// ファイル内容チェック
        /// </summary>
        /// <param name="selected_file"></param>
        internal async Task<bool> CheckSettingFile(string selected_file)
        {
            //設定ファイルパスチェック
            if (!CheckSettingFilePath(selected_file))
            {
                return false;
            }

            if (await SewerHeatUtil.CheckIniFileAsync(selected_file, "延床面積集計設定", _WindwoName))
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        /// <summary>
        /// 上流側延床面積初期化ボタンクリック
        /// </summary>
        private void OnInitArea()
        {
            Area4 = "0";
            Area1 = "0";
            Area2 = "0";
            Area3 = "0";
        }

        /// <summary>
        /// 設定ファイルパスチェック
        /// </summary>
        /// <returns></returns>
        private bool CheckSettingFilePath(string path)
        {
            string msg = "";
            bool checkResult = true;
            //設定ファイルが指定されているかどうかをチェック
            if (string.IsNullOrEmpty(path) || !File.Exists(path))
            {
                checkResult = false;
                msg += "「設定ファイル」のパスが不正です。";
            }

            if (!checkResult)
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show(msg, _WindwoName);
            }

            return checkResult;
        }

        /// <summary>
        /// 文字列が符号なしの小数かどうかを判定します
        /// </summary>
        /// <param name="target">対象の文字列</param>
        /// <returns>文字列が符号なしの小数の場合はtrue、それ以外はfalse</returns>
        public static bool IsUnsignedDecimal(string target)
        {
            return new System.Text.RegularExpressions.Regex("^[0-9]*\\.?[0-9]+$").IsMatch(target);
        }

        /// <summary>
        /// 管渠選択ボタンクリック
        /// </summary>
        private async Task OnExecuteAsync()
        {
            var mapView = MapView.Active;
            if (mapView == null)
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("マップを開いてください。", _WindwoName);
                return;
            }

            //設定ファイルパスチェック
            if (!await CheckSettingFile(FilePath))
            {
                return;
            }

            double areaVal1;
            if (!double.TryParse(Area1, out areaVal1) || !IsUnsignedDecimal(Area1))
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("「上流側延床面積1」には半角数字を入力してください。", _WindwoName);
                return;
            }

            double areaVal2;
            if (!double.TryParse(Area2, out areaVal2) || !IsUnsignedDecimal(Area2))
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("「上流側延床面積2」には半角数字を入力してください。", _WindwoName);
                return;
            }

            double areaVal3;
            if (!double.TryParse(Area3, out areaVal3) || !IsUnsignedDecimal(Area3))
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("「上流側延床面積3」には半角数字を入力してください。", _WindwoName);
                return;
            }

            double areaVal4;
            if (!double.TryParse(Area4, out areaVal4) || !IsUnsignedDecimal(Area4))
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("「上流側延床面積4」には半角数字を入力してください。", _WindwoName);
                return;
            }

            //選択状態をクリア
            await QueuedTask.Run(() =>
            {
                Map map = mapView.Map;
                map.ClearSelection();
            });

            if (_eventToken == null)
            {
                _eventToken = MapSelectionChangedEvent.Subscribe(OnMapSelectionChangedEvent);
            }

            ICommand cmd = FrameworkApplication.GetPlugInWrapper("esri_mapping_selectByRectangleTool") as ICommand;
            if ((cmd != null) && cmd.CanExecute(null))
            {
                cmd.Execute(null);
            }
            else
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("選択できません", _WindwoName);
            }
        }

        public void WindowClosed()
        {
            closed = true;

            //Unsubscribeする
            MapSelectionChangedEvent.Unsubscribe(_eventToken);
            if (_eventToken != null)
            {
                _eventToken = null;
            }

            //map操作にもどす
            _ = FrameworkApplication.SetCurrentToolAsync("esri_mapping_exploreTool");
        }

        private async void OnMapSelectionChangedEvent(MapSelectionChangedEventArgs obj)
        {
            string procName = "延床面積集計";

            if (obj.Map != MapView.Active.Map) return;
            Map map = obj.Map;
            int count = map.SelectionCount;
            if (count == 0)
            {
                return;
            }
            else if (count > 1)
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("管渠1件だけ選択してください", _WindwoName);
                return;
            }

            await QueuedTask.Run(() =>
            {
                //FlashFeature
                MapView.Active.FlashFeature(MapView.Active.Map.GetSelection());
            });

            //Unsubscribeする
            MapSelectionChangedEvent.Unsubscribe(_eventToken);
            if (_eventToken != null)
            {
                _eventToken = null;
            }

            MessageBoxResult ret = ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show(SewerHeatUtil.confirmationMessage("この管渠で" + procName), _WindwoName, MessageBoxButton.OKCancel, MessageBoxImage.Question, MessageBoxResult.Cancel);
            if (ret != MessageBoxResult.OK)
            {
                //map操作にもどす
                _ = FrameworkApplication.SetCurrentToolAsync("esri_mapping_exploreTool");
                return;
            }

            //下流追跡及び延床面積集計　処理実行
            ExecuteTool(procName, "CalculateTeikaYuka", new object[] { FilePath, double.Parse(Area1), double.Parse(Area2), double.Parse(Area3), double.Parse(Area4) });

        }

        /// <summary>
        /// ツールボックスのスクリプトを実行する
        /// </summary>
        /// <param name="name"></param>
        /// <param name="toolname"></param>
        /// <param name="args"></param>
        private async void ExecuteTool(string name, string toolname, params object[] args)
        {
            await QueuedTask.Run(async () =>
            {
                try
                {
                    // ツールボックスのパス指定
                    string toolPath = SewerHeatUtil.GetToolPath(toolname);

                    var parameters = Geoprocessing.MakeValueArray(args);
                    var environments = Geoprocessing.MakeEnvironmentArray(overwriteoutput: true);

                    System.Threading.CancellationTokenSource _cts = new System.Threading.CancellationTokenSource();

                    GPExecuteToolFlags executeFlags = GPExecuteToolFlags.AddOutputsToMap
                                                      | GPExecuteToolFlags.RefreshProjectItems;

                    IGPResult gpResult = await Geoprocessing.ExecuteToolAsync(toolPath, parameters, environments, _cts.Token,
                        (event_name, o) =>  // implement delegate and handle events, o is message object.
                        {
                            switch (event_name)
                            {
                                case "OnValidate":
                                    break;
                                case "OnProgressMessage":
                                    break;
                                case "OnProgressPos":
                                    break;
                                case "OnMessage":
                                    break;
                                case "OnBeginExecute":
                                    break;
                                case "OnEndExecute":
                                    break;
                            }
                        },
                        executeFlags
                    );
                    string msg = "";
                    if (gpResult.IsFailed)
                    {
                        msg = "エラーが発生しました。\r\n";
                        if (gpResult.ErrorMessages.Count() > 0)
                        {
                            msg += gpResult.ErrorMessages.FirstOrDefault().Text;
                        }
                    }
                    else
                    {
                        msg = "処理を終了しました。";
                    }
                    if (!closed)
                    {
                        ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show(msg, _WindwoName);
                    }

                }
                catch (Exception exc)
                {
                    if (!closed)
                    {
                        ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("エラーが発生しました。\r\nメッセージ：\r\n" + exc.Message, _WindwoName);
                    }
                }

            });

            //map操作にもどす
            _ = FrameworkApplication.SetCurrentToolAsync("esri_mapping_exploreTool");
        }
    }
}
