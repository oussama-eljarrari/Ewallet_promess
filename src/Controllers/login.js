
import {finduserbymail} from "../Model/database.js";

// recuperation des elements DOM
const mailInput = document.getElementById("mail");
const passwordInput  = document.getElementById("password");
const submitBtn = document.getElementById("submitbtn");
const display   = document.getElementById("display");
// event listener sur le bouton Se connecter
submitBtn.addEventListener("click", handleSubmit);

function handleSubmit() {
    let mail = mailInput.value;
    let password = passwordInput.value;

    if (!mail || password === "") {
        alert("Bad credentials.");
    } else {
        submitBtn.textContent = "Checking!!!";
        const user = finduserbymail(mail, password);

        setTimeout(() => {
            if (user) {
                sessionStorage.setItem("currentUser", JSON.stringify(user));
                document.location = "dashboard.html";
            } else {
                alert("Bad credentials.");
                submitBtn.textContent = "Se connecter";
            }
        }, 2000);
    }
}