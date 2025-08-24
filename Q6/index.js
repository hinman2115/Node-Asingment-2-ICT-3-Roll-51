const express = require("express");
const axios = require("axios");
const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Replace with your free API key from OpenWeatherMap
const API_KEY = "your_api_key_here";

// Home route
app.get("/", (req, res) => {
    res.render("weather", { weather: null, error: null });
});

// Fetch weather from backend
app.post("/getWeather", async (req, res) => {
    const city = req.body.city;

    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        const weatherData = {
            city: response.data.name,
            temp: response.data.main.temp,
            desc: response.data.weather[0].description,
        };

        res.render("weather", { weather: weatherData, error: null });
    } catch (error) {
        res.render("weather", { weather: null, error: "City not found!" });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
