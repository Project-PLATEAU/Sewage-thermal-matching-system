using SewerHeatGIS_Web.Logics;

namespace SewerHeatGIS_Web.Models
{
    /// <summary>
    /// エクセル(検討ツール)の入力値
    /// </summary>
    public class ExcelToolModel
    {
        /// <summary>
        /// 地域選択(C7)
        /// </summary>
        public string? Chiki { get; set; }
        /// <summary>
        /// 熱利用用途
        /// </summary>
        public int HeatType { get; set; }
        /// <summary>
        /// 建物用途(C9)
        /// </summary>
        public string? Youto { get; set; }
        /// <summary>
        /// 延床面積(C10)
        /// </summary>
        public double Nobeyuka { get; set; }
        /// <summary>
        /// 熱利用場所の下水熱ポテンシャル(C47)
        /// </summary>
        public double PotentialY { get; set; }
        /// <summary>
        /// 下水取得場所と熱利用場所の距離(C57)
        /// </summary>

        public double PipeLength { get; set; }

    }
}
