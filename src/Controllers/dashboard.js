import {getDashboardData } from "../Service/dashboardService.js";

const user = JSON.parse(sessionStorage.getItem("currentUser"));

if (!user) {
    document.location = "login.html";
}

const dashboardData = getDashboardData();


