import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import ReactECharts from "echarts-for-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Button } from "./ui/button"
import { useAuth } from "../context/AuthContext"
import { DatePickerWithRange } from "./ui/date-range"
import { DateRange } from "react-day-picker"
import { format, parse } from "date-fns"
import { Loader2 } from 'lucide-react'
import Navbar from "./Navbar"
import Cookies from "js-cookie"



type BarChartData = {
    name: string; // Feature name, e.g., 'a', 'b', etc.
    value: number; // Aggregated value for the feature
  };
  type LineChartData = {
    [feature: string]: {
      day: string; // Date in 'MM/DD/YYYY' format or locale-specific format
      value: number; // Aggregated daily value for the feature
    }[];
  };


export default function Dashboard() {
  const [barChartData, setBarChartData] = useState<BarChartData[]>([])
  const [lineChartData, setLineChartData] = useState<LineChartData>({})

  const [age, setAge] = useState("all")
  const [gender, setGender] = useState("all")
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2022, 9, 4),
    to: new Date(2022, 9, 29),
  })
  const [isFiltersInitialized, setIsFiltersInitialized] = useState<Boolean>(false);
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const { token, logout } = useAuth()

  useEffect(() => {
    if (!token) {
        navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
  
    const searchParams = new URLSearchParams(location.search);
    const startDate = searchParams.get("startDate") || Cookies.get("startdate");
    const endDate = searchParams.get("endDate") || Cookies.get("enddate");
    const sharedAge = searchParams.get("age") || Cookies.get("age");
    const sharedGender = searchParams.get("gender") || Cookies.get("gender");
  
    const newDateRange = {
      from: startDate ? parse(startDate, "dd/MM/yyyy", new Date()) : dateRange?.from,
      to: endDate ? parse(endDate, "dd/MM/yyyy", new Date()) : dateRange?.to,
    };
  
    setDateRange(newDateRange);
    setAge(sharedAge || "all");
    setGender(sharedGender || "all");
  
    // Ensure this runs only once, after all filters are set
    setIsFiltersInitialized(true);
  }, [token, navigate, location.search]);
  
  useEffect(() => {
    if (isFiltersInitialized && token && dateRange?.from && dateRange?.to) {
        Cookies.set("age", age)
        Cookies.set("gender", gender)
        Cookies.set("startdate", format(dateRange.from, "dd/MM/yyyy"))
        Cookies.set("enddate", format(dateRange.to, "dd/MM/yyyy"))
      fetchData();
    }
  }, [isFiltersInitialized, token, dateRange, age, gender]);
  
  const fetchData = async () => {
    if (!token || !dateRange?.from || !dateRange?.to) return;
  
    setIsLoading(true);
  
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/data`,
        {
          headers: { Authorization: `Bearer ${token}` },
           credentials: "include"
        }
      );
  
      if (response.ok) {
        const result = await response.json();
        // setData(result.data);
        setBarChartData(result.data.barChartData);
      setLineChartData(result.data.lineChartData);
      } else {
        console.error("Failed to fetch data");
        if (response.status === 401 || response.status === 403 ) {
          logout();
          navigate("/login");
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

const prepareLineChartData = (inputData: LineChartData, feature: string) => {
    return inputData[feature]
  }
  const barChartOptions = {
    tooltip: { trigger: "item" },
    xAxis: { type: "value" , name:"Total hours spent",nameLocation: "middle", nameGap: 30,},
    yAxis: {
        name:"Feature",
        nameLocation: "middle", 
        nameGap: 30,
      type: "category",
      data: barChartData.map((item) => item.name),
    },
    series: [
      {
        type: "bar",
        data: barChartData.map((item) => item.value),
        emphasis: {
          focus: "series",
        },
      },
    ],
  }

  const lineChartOptions = selectedFeature
    ? {
        tooltip: { trigger: "axis" },
        xAxis: {
            name:"Date",
            nameLocation: "middle", 
            nameGap: 30,
          type: "category",
          data: prepareLineChartData(lineChartData, selectedFeature).map((item) => item.day),
        },
        yAxis: { type: "value" ,  name:"Total hours spent",nameLocation: "middle", nameGap: 50},
        series: [
          {
            type: "line",
            data: prepareLineChartData(lineChartData, selectedFeature).map((item) => item.value),
            smooth: true,
          },
        ],
        dataZoom: [
     
          {
            type: "inside",
            xAxisIndex: 0,
            start: 0,
            end: 100,
          },
        ],
      }
    : null

  const handleShare = () => {
    const startDate = dateRange?.from ? format(dateRange.from, "dd/MM/yyyy") : ""
    const endDate = dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : ""
    const url = `${window.location.origin}/dashboard?startDate=${startDate}&endDate=${endDate}&age=${age}&gender=${gender}`
    navigator.clipboard.writeText(url)
  }

  const handleResetPreferences = () => {
    const newStartDate = "4/10/2022";
    const newEndDate = "29/10/2022";
    const newDateRange = {
        from:  parse(newStartDate, "dd/MM/yyyy", new Date()),
        to:parse(newEndDate, "dd/MM/yyyy", new Date())
      };
    
      setDateRange(newDateRange);
      setAge("all");
      setGender("all");
      setSelectedFeature(null)
    Cookies.set("age", "all", { sameSite: "None" })
    Cookies.set("gender", "all", { sameSite: "None" })
    Cookies.set("startdate", newStartDate, { sameSite: "None" })
    Cookies.set("enddate", newEndDate, { sameSite: "None" })
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onLogout={logout} onShare={handleShare} />
      <div className="container mx-auto p-4 flex-grow">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>View and analyze your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <DatePickerWithRange
                className="w-[300px]"
                date={dateRange}
                setDate={setDateRange}
              />
              <Select value={age} onValueChange={setAge}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="15-25">15-25</SelectItem>
                  <SelectItem value=">25">&gt;25</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleResetPreferences}>Reset preferences</Button>
            </div>

            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <div className="h-[400px] mb-8">
                  <ReactECharts
                    option={barChartOptions}
                    style={{ height: "100%", width: "100%" }}
                    onEvents={{
                      click: (params) => setSelectedFeature(params.name),
                    }}
                  />
                </div>

                {selectedFeature && (
                  <div className="h-[400px]">
                    <h3 className="text-lg font-semibold mb-2">
                      Time Trend for Feature {selectedFeature.toUpperCase()}
                    </h3>
                    <ReactECharts
                      option={lineChartOptions}
                      style={{ height: "100%", width: "100%" }}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}