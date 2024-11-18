const axios = require("axios");
const csv = require("csv-parser");

function cleanDate(dateString) {
  const [date, month, year] = dateString.split("/");
  return new Date(year, month - 1, date);
}

function cleanData(data) {
  const cleanedData = {};
  Object.keys(data).forEach((item) => {
    if (item === "Day") {
      cleanedData[item.toLowerCase()] = cleanDate(data[item]);
      return;
    }
    if (item === "Gender") {
      cleanedData[item.toLowerCase()] = data[item]?.toLowerCase();
      return;
    }
    cleanedData[item.toLowerCase()] = data[item];
  });
  return cleanedData;
}

async function fetchDataFromGoogleSheet() {
  try {
    const response = await axios.get(
      "https://docs.google.com/spreadsheets/d/1l7GstWHc69HPV0irSdvoMIyHgtufUPKsbtCiNw7IKR0/export?format=csv",
      {
        responseType: "stream",
      }
    );

    const data = [];
    const parser = response.data.pipe(csv());
    for await (const row of parser) {
      data.push(cleanData(row));
    }

    return data;
  } catch (error) {
    throw new Error(`Error fetching or parsing data: ${error.message}`);
  }
}

function aggregateData(data) {
  return Object.entries(
    data.reduce((acc, curr) => {
      ["a", "b", "c", "d", "e", "f"].forEach((feature) => {
        acc[feature] = (acc[feature] || 0) + parseInt(curr[feature], 10);
      });
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));
}

function prepareLineChartData(inputData) {
  const featureLineData = {};

  ["a", "b", "c", "d", "e", "f"].forEach((feature) => {
    const groupedData = inputData.reduce((acc, d) => {
      const date = new Date(d.day).toLocaleDateString();
      acc[date] = (acc[date] || 0) + parseInt(d[feature], 10);
      return acc;
    }, {});

    featureLineData[feature] = Object.entries(groupedData).map(([day, value]) => ({
      day,
      value,
    }));
  });

  return featureLineData;
}

const dataProcessing = async (req, res) => {
    const { startdate, enddate, age, gender } = req.query;

    console.log("Api hit")
    // Set cookies for the frontend
    res.cookie("startdate", startdate, {  sameSite: "none", secure: true  });
    res.cookie("enddate", enddate, {  sameSite: "none", secure: true  });
    res.cookie("age", age || "all", {  sameSite: "none", secure: true  });
    res.cookie("gender", gender || "all", {  sameSite: "none", secure: true  });
  
  try {
    // Fetch and process data
    const data = await fetchDataFromGoogleSheet();

    // Apply filters
    let filteredData = data;

    // Date range filter
    if (startdate && enddate) {
      const startDateObj = cleanDate(startdate);
      const endDateObj = cleanDate(enddate);

      filteredData = filteredData.filter(
        (item) => item.day >= startDateObj && item.day <= endDateObj
      );
    }

    // Age filter
    if (age && age !== "all") {
      filteredData = filteredData.filter((item) => item.age === age);
    }

    // Gender filter
    if (gender && gender !== "all") {
      filteredData = filteredData.filter(
        (item) => item.gender === gender.toLowerCase()
      );
    }

    // Process bar chart data
    const aggregatedData = aggregateData(filteredData);

    // Process line chart data for all features
    const lineChartData = prepareLineChartData(filteredData);

    
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    // Send processed data
    res.json({
      success: true,
      data: {
        barChartData: aggregatedData,
        lineChartData,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  dataProcessing,
};
