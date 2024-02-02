using ArcGIS.Desktop.Core.Geoprocessing;
using ArcGIS.Desktop.Framework;
using ArcGIS.Desktop.Framework.Threading.Tasks;
using ArcGIS.Desktop.Mapping;
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
using System.Windows.Threading;

namespace SewerHeatGIS_ProAppModule.Views
{
    public class HeatDemandCalculationViewModel : INotifyPropertyChanged
    {
        private readonly string _WindwoName = "下水熱設定ツール";
        public event EventHandler ClosingRequest;
        public event PropertyChangedEventHandler PropertyChanged = delegate { };
        private RelayCommand _SelectFileForSewageHeatCommand = null;
        private RelayCommand _SelectFileForBuildingCommand = null;
        private RelayCommand _ExecuteHeatDemandCommand = null;
        private RelayCommand _ExecuteSearchPipeCommand = null;
        private RelayCommand _CloseCommand = null;
        private string _FilePathForSewageHeat = "";
        private string _FilePathForBuilding = "";
        private string _StatusMessage = "";
        private bool _radioPipe = true;
        private bool _radioMasu = false;
        private bool _radioMasuEnabled = true;
        public bool closed { get; set; } = false;

        protected virtual void NotifyPropertyChanged([CallerMemberName] string propertyName = null)
        {
            if (PropertyChanged != null)
            {
                PropertyChanged(this, new PropertyChangedEventArgs(propertyName));
            }
        }
        public HeatDemandCalculationViewModel()
        {
            _SelectFileForSewageHeatCommand = new RelayCommand(OnSelectFileForSewageHeat);
            _SelectFileForBuildingCommand = new RelayCommand(OnSelectFileForBuilding);
            _ExecuteHeatDemandCommand = new RelayCommand(OnExecuteHeatDemand);
            _ExecuteSearchPipeCommand = new RelayCommand(OnExecuteSearchPipe);
            _CloseCommand = new RelayCommand(OnClose);
        }

        /// <summary>
        /// 下水熱算出設定ファイルパス
        /// </summary>
        public string FilePathForSewageHeat
        {
            get { return _FilePathForSewageHeat; }
            set
            {
                _FilePathForSewageHeat = value;
                NotifyPropertyChanged("FilePathForSewageHeat");
            }
        }

        /// <summary>
        /// 建物用途変換設定ファイルパス
        /// </summary>
        public string FilePathForBuilding
        {
            get { return _FilePathForBuilding; }
            set
            {
                _FilePathForBuilding = value;
                NotifyPropertyChanged("FilePathForBuilding");
            }
        }

        /// <summary>
        /// 建物からの距離で管渠を検索ラジオボタン
        /// </summary>
        public bool radioPipe
        {
            get { return _radioPipe; }
            set { _radioPipe = value; NotifyPropertyChanged("radioPipe"); }
        }

        /// <summary>
        /// 建物からの距離で桝を検索ラジオボタン
        /// </summary>
        public bool radioMasu
        {
            get { return _radioMasu; }
            set { _radioMasu = value; NotifyPropertyChanged("radioMasu"); }
        }

        /// <summary>
        /// 建物からの距離で桝を検索ラジオボタン enabled状態
        /// </summary>
        public bool radioMasuEnabled
        {
            get { return _radioMasuEnabled; }
            set { _radioMasuEnabled = value; NotifyPropertyChanged("radioMasuEnabled"); }
        }

        /// <summary>
        /// 処理状況
        /// </summary>
        public string StatusMessage
        {
            get { return _StatusMessage; }
            set { _StatusMessage = value; NotifyPropertyChanged("StatusMessage"); }
        }

        /// <summary>
        /// 下水熱算出設定ファイル選択ボタンコマンド
        /// </summary>
        public ICommand SelectFileForSewageHeat
        {
            get
            {
                return _SelectFileForSewageHeatCommand;
            }
        }

        /// <summary>
        /// 建物用途変換設定ファイル選択ボタンコマンド
        /// </summary>
        public ICommand SelectFileForBuilding
        {
            get
            {
                return _SelectFileForBuildingCommand;
            }
        }

        /// <summary>
        /// 熱需要算出処理実行ボタンコマンド
        /// </summary>
        public ICommand ExecuteHeatDemand
        {
            get
            {
                return _ExecuteHeatDemandCommand;
            }
        }

        /// <summary>
        /// 最寄り管渠検索処理実行ボタンコマンド
        /// </summary>
        public ICommand ExecuteSearchPipe
        {
            get
            {
                return _ExecuteSearchPipeCommand;
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
        /// 処理状況クリア
        /// </summary>
        private void ClearTextBlock()
        {
            StatusMessage = "";
        }

        /// <summary>
        /// 処理状況更新
        /// </summary>
        /// <param name="msg"></param>
        private void UpdateTextBlock(string msg)
        {
            StatusMessage = msg;
        }

        /// <summary>
        /// 下水熱算出設定ファイル選択ボタンクリック
        /// </summary>
        private async void OnSelectFileForSewageHeat()
        {
            var dialog = new OpenFileDialog();
            dialog.Filter = "テキスト文書|*.txt";

            // ダイアログを表示する
            if (dialog.ShowDialog() == true)
            {
                FilePathForSewageHeat = dialog.FileName;

                // 選択されたファイル名 (ファイルパス) をチェックしてメッセージボックスに表示
                bool ret = await CheckSettingFile(dialog.FileName);
            }
        }

        /// <summary>
        /// 設定ファイル内容チェック
        /// </summary>
        /// <param name="selected_file"></param>
        /// <param name="showMsg"></param>
        internal async Task<bool> CheckSettingFile(string selected_file, bool showMsg = true)
        {
            //設定ファイルパスチェック
            if (!CheckSettingFilePath(selected_file, showMsg))
            {
                return　false;
            }

            if (await SewerHeatUtil.CheckIniFileAsync(selected_file, "下水熱算出処理用設定ファイル", _WindwoName, showMsg))
            {
                if (!await CheckKeyFieldAsync(selected_file, showMsg))
                {
                    //「建物からの距離で桝を検索」のラジオボタンをOFFにする
                    radioPipe = true;
                    radioMasuEnabled = false;
                }
                else
                {
                    radioMasuEnabled = true;
                }
                return true;
            }
            else
            {
                return false;
            }
        }

        /// <summary>
        /// 建物用途設定ファイル選択ボタンクリック
        /// </summary>
        private async void OnSelectFileForBuilding()
        {
            var dialog = new OpenFileDialog();
            dialog.Filter = "テキスト文書|*.txt";

            // ダイアログを表示する
            if (dialog.ShowDialog() == true)
            {
                // 選択されたファイル名 (ファイルパス) をメッセージボックスに表示
                bool ret = await CheckSettingFileForBuilding(dialog.FileName);
                if (ret)
                {
                    FilePathForBuilding = dialog.FileName;
                }
            }
        }

        /// <summary>
        /// 建物用途変換ファイル内容チェック
        /// </summary>
        /// <param name="selected_file"></param>
        internal async Task<bool> CheckSettingFileForBuilding(string selected_file)
        {
            //設定ファイルパスチェック
            if (!CheckSettingFilePathBuilding(selected_file))
            {
                return false;
            }

            if (await SewerHeatUtil.CheckIniFileAsync(selected_file, "建物用途変換テーブル", _WindwoName))
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        /// <summary>
        /// 「桝と管渠とのキーフィールド」の設定値をチェックする
        /// </summary>
        /// <param name="path"></param>
        /// <param name="showMsg"></param>
        /// <returns></returns>
        internal async Task<bool> CheckKeyFieldAsync(string path, bool showMsg)
        {
            string msg = "設定ファイルチェックエラー";
            try
            {
                bool ret = true;

                //「桝と管渠とのキーフィールド」のチェックをする
                string toolPath = SewerHeatUtil.GetToolPath("CheckKeyField");
                var parameters = Geoprocessing.MakeValueArray(new object[] { path });
                var environments = Geoprocessing.MakeEnvironmentArray(overwriteoutput: true);

                System.Threading.CancellationTokenSource _cts = new System.Threading.CancellationTokenSource();
                IGPResult gpResult = await Geoprocessing.ExecuteToolAsync(toolPath, parameters, null, null, null, GPExecuteToolFlags.None);

                if (gpResult.IsFailed)
                {
                    ret = false;
                }
                return ret;
            }
            catch (Exception exc)
            {
                if (showMsg)
                {
                    ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show($"{msg}\r\nメッセージ：\r\n{exc.Message}", _WindwoName);
                }
                return false;
            }
        }

        /// <summary>
        /// 熱需要算出処理実行で使用する設定ファイルパスチェック
        /// </summary>
        /// <returns></returns>
        private async Task<bool> CheckSettingFilePathAll()
        {
            //設定ファイルチェック
            if (await CheckSettingFile(FilePathForSewageHeat) && await CheckSettingFileForBuilding(FilePathForBuilding))
            {
                return true;
            }
            return false;
        }

        /// <summary>
        /// 設定ファイルパス存在チェック
        /// </summary>
        /// <returns></returns>
        internal bool CheckSettingFilePath(string path, bool showMsg = true)
        {
            string msg = "";
            bool checkResult = true;
            //設定ファイルが指定されているかどうかをチェック
            if (string.IsNullOrEmpty(path) || !File.Exists(path))
            {
                checkResult = false;
                msg = "「設定ファイル」のパスが不正です。";
            }

            if (!checkResult && showMsg)
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show(msg, _WindwoName);
            }

            return checkResult;
        }

        /// <summary>
        /// 建物用途変換ファイルパ存在チェック
        /// </summary>
        /// <returns></returns>
        private bool CheckSettingFilePathBuilding(string path)
        {
            string msg = "";
            bool checkResult = true;
            //建物用途設定変換ファイルが指定されているかどうかをチェック
            if (string.IsNullOrEmpty(path) || !File.Exists(path))
            {
                checkResult = false;
                msg = "「建物用途変換ファイル」のパスが不正です。";
            }

            if (!checkResult)
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show(msg, _WindwoName);
            }

            return checkResult;
        }

        /// <summary>
        /// 熱需要算出処理実行
        /// </summary>
        private async void OnExecuteHeatDemand()
        {
            if (MapView.Active == null)
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("マップを開いてください。", _WindwoName);
                return;
            }

            //設定ファイルパスチェック
            if (!await CheckSettingFilePathAll())
            {
                return;
            }

            string procName = "熱需要算出処理";

            MessageBoxResult ret = ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show(SewerHeatUtil.confirmationMessage(procName), _WindwoName, MessageBoxButton.OKCancel, MessageBoxImage.Question, MessageBoxResult.Cancel);
            if (ret != MessageBoxResult.OK)
            {
                return;
            }

            //熱需要算出処理実行
            ExecuteTool(procName, "CalculateHeatDemand", new object[] { FilePathForSewageHeat, FilePathForBuilding });
        }

        /// <summary>
        /// 最寄り管渠検索処理実行
        /// </summary>
        private async void OnExecuteSearchPipe()
        {
            if (MapView.Active == null)
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("マップを開いてください。", _WindwoName);
                return;
            }

            //設定ファイルパスチェック
            if (!await CheckSettingFile(FilePathForSewageHeat))
            {
                return;
            }

            bool pipe = radioPipe;
            bool masu = radioMasu;

            string executePy = "";
            string layerKeyName = "";
            if (pipe)
            {
                executePy = "NearBuildingToDrainPipe";
                layerKeyName = "管渠レイヤ名";
            }
            if (masu)
            {
                executePy = "NearBuildingToInlet";
                layerKeyName = "桝レイヤ名";
            }

            if (await SewerHeatUtil.ClearSelectionByLayerKeyName(FilePathForSewageHeat, "下水熱算出処理用設定ファイル", layerKeyName) == false)
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("レイヤの選択解除に失敗しました。", _WindwoName);
                return;
            }

            string procName = "最寄り管渠検索処理";

            MessageBoxResult ret = ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show(SewerHeatUtil.confirmationMessage(procName), _WindwoName, MessageBoxButton.OKCancel, MessageBoxImage.Question, MessageBoxResult.Cancel);
            if (ret != MessageBoxResult.OK)
            {
                return;
            }

            //最寄り管渠検索処理実行
            ExecuteTool(procName, executePy, new object[] { FilePathForSewageHeat });
        }

        /// <summary>
        /// ツールボックスのスクリプトを実行する
        /// </summary>
        /// <param name="name"></param>
        /// <param name="toolname"></param>
        /// <param name="args"></param>
        private async void ExecuteTool(string name, string toolname, params object[] args)
        {
            ClearTextBlock();
            await QueuedTask.Run(async () =>
            {
                try
                {
                    // ツールボックスのパス指定
                    string toolPath = SewerHeatUtil.GetToolPath(toolname);

                    var parameters = Geoprocessing.MakeValueArray(args);
                    var environments = Geoprocessing.MakeEnvironmentArray(overwriteoutput: true);

                    // cancellation token variable is declared as a class member
                    System.Threading.CancellationTokenSource _cts = new System.Threading.CancellationTokenSource();

                    GPExecuteToolFlags executeFlags = GPExecuteToolFlags.AddOutputsToMap
                                                      | GPExecuteToolFlags.RefreshProjectItems;

                    IGPResult gpResult = await Geoprocessing.ExecuteToolAsync(toolPath, parameters, environments, _cts.Token,
                        (event_name, o) =>  // implement delegate and handle events, o is message object.
                        {
                            switch (event_name)
                            {
                                case "OnValidate": // stop execute if any warnings
                                                   //if ((o as IGPMessage[]).Any(it => it.Type == GPMessageType.Warning))
                                                   //    _cts.Cancel();
                                    break;
                                case "OnProgressMessage":
                                    //string msg1 = string.Format("{0} % {1}", new object[] { event_name, (string)o });
                                    UpdateTextBlock(name + ": " + o as string);
                                    break;
                                case "OnProgressPos":
                                    //string msg2 = string.Format("{0} % {1}", new object[] { event_name, (int)o });
                                    //_cts.Cancel();
                                    break;
                                case "OnMessage":
                                    IGPMessage gpMsg = (IGPMessage)o;
                                    //string msg3 = string.Format("{0} : {1} % {2}", new object[] { event_name, gpMsg.GetType(), gpMsg.Text });
                                    UpdateTextBlock(name + ": " + gpMsg.Text);
                                    break;
                                case "OnBeginExecute":
                                    //string msg4 = string.Format("{0} % {1}", new object[] { event_name, (string)o });
                                    break;
                                case "OnEndExecute":
                                    //IGPResult gpRet = (IGPResult)o;
                                    //foreach (var retMsg in gpRet.Messages)
                                    //{
                                    //    string msg5 = string.Format("{0} % {1}", new object[] { event_name, retMsg });
                                    //}
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
                            msg = msg + gpResult.ErrorMessages.FirstOrDefault().Text;
                        }
                    }
                    else
                    {
                        msg = "処理を終了しました。";
                    }

                    if(!closed)
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
                finally
                {
                    ClearTextBlock();
                }
            });

        }
    }
}
