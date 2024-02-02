namespace SewerHeatGIS_Web.Models
{
    public class ReportModel
    {
        /// <summary>
        /// 熱利用用途
        /// </summary>
        public int HeatType { get; set; } = 3;

        /// <summary>
        /// 建物ID
        /// </summary>
        public string BuildingID { get; set; } = "";

        /// <summary>
        /// 建物用途
        /// </summary>
        public string BuildingYouto { get; set; } = "";

        /// <summary>
        /// 建物面積
        /// </summary>
        public string BuildingNobeyuka { get; set; } = "";

        /// <summary>
        /// 建物サイズ
        /// </summary>
        public string BuildingHeatPumpSize { get; set; } = "";

        /// <summary>
        /// 熱需要値
        /// </summary>
        public string BuildingReHeatDemand { get; set; } = "";

        public string PipeID { get; set; } = "";

        public string PipeDiameter { get; set; } = "";

        public string PipeSecDist { get; set; } = "";

        public string PipePotentialS { get; set; } = "";

        public string PipePotentialW { get; set; } = "";
        public string PipePotentialY { get; set; } = "";

        public string PipeConstYear { get; set; } = "";

        public string Url { get; set; } = "";

    }
}
