const rateLimit = require("express-rate-limit");
const SessionHandler = require("./session");
const ProfileHandler = require("./profile");
const BenefitsHandler = require("./benefits");
const ContributionsHandler = require("./contributions");
const AllocationsHandler = require("./allocations");
const MemosHandler = require("./memos");
const ResearchHandler = require("./research");
const {
    environmentalScripts
} = require("../../config/config");
const ErrorHandler = require("./error").errorHandler;

const index = (app, db) => {

    "use strict";

    const sessionHandler = new SessionHandler(db);
    const profileHandler = new ProfileHandler(db);
    const benefitsHandler = new BenefitsHandler(db);
    const contributionsHandler = new ContributionsHandler(db);
    const allocationsHandler = new AllocationsHandler(db);
    const memosHandler = new MemosHandler(db);
    const researchHandler = new ResearchHandler(db);

    // Fix for missing rate limiting (express-rate-limit v5 for Node 12)
    const generalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300
    });
    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20
    });
    app.use(generalLimiter);

    // Middleware to check if a user is logged in
    const isLoggedIn = sessionHandler.isLoggedInMiddleware;

    //Middleware to check if user has admin rights
    const isAdmin = sessionHandler.isAdminUserMiddleware;

    // The main page of the app
    app.get("/", sessionHandler.displayWelcomePage);

    // Login form
    app.get("/login", sessionHandler.displayLoginPage);
    app.post("/login", loginLimiter, sessionHandler.handleLoginRequest);

    // Signup form
    app.get("/signup", sessionHandler.displaySignupPage);
    app.post("/signup", sessionHandler.handleSignup);

    // Logout page
    app.get("/logout", sessionHandler.displayLogoutPage);

    // The main page of the app
    app.get("/dashboard", isLoggedIn, sessionHandler.displayWelcomePage);

    // Profile page
    app.get("/profile", isLoggedIn, profileHandler.displayProfile);
    app.post("/profile", isLoggedIn, profileHandler.handleProfileUpdate);

    // Contributions Page
    app.get("/contributions", isLoggedIn, contributionsHandler.displayContributions);
    app.post("/contributions", isLoggedIn, contributionsHandler.handleContributionsUpdate);

    // Benefits Page
    app.get("/benefits", isLoggedIn, benefitsHandler.displayBenefits);
    app.post("/benefits", isLoggedIn, benefitsHandler.updateBenefits);
    /* Fix for A7 - checks user role to implement  Function Level Access Control
     app.get("/benefits", isLoggedIn, isAdmin, benefitsHandler.displayBenefits);
     app.post("/benefits", isLoggedIn, isAdmin, benefitsHandler.updateBenefits);
     */

    // Allocations Page
    app.get("/allocations/:userId", isLoggedIn, allocationsHandler.displayAllocations);

    // Memos Page
    app.get("/memos", isLoggedIn, memosHandler.displayMemos);
    app.post("/memos", isLoggedIn, memosHandler.addMemos);

    // Fix for open redirect: only redirect to known learning resources
    const LEARN_LINKS = [
        "https://www.khanacademy.org/economics-finance-domain/core-finance/investment-vehicles-tutorial/ira-401ks/v/traditional-iras"
    ];

    // Handle redirect for learning resources link
    app.get("/learn", isLoggedIn, (req, res) => {
        const target = LEARN_LINKS.find(link => link === req.query.url);
        if (!target) {
            return res.status(400).send("Invalid learning resource link");
        }
        return res.redirect(target);
    });

    // Handle redirect for learning resources link
    app.get("/tutorial", (req, res) => {
        return res.render("tutorial/a1", {
            environmentalScripts
        });
    });

    // Fix for path traversal: only render known tutorial pages
    const TUTORIAL_PAGES = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10", "ssrf", "redos"];

    app.get("/tutorial/:page", (req, res) => {
        const page = TUTORIAL_PAGES.find(p => p === req.params.page);
        if (!page) {
            return res.status(404).send("Page not found");
        }
        return res.render(`tutorial/${page}`, {
            environmentalScripts
        });
    });

    // Research Page
    app.get("/research", isLoggedIn, researchHandler.displayResearch);

    // Error handling middleware
    app.use(ErrorHandler);
};

module.exports = index;
