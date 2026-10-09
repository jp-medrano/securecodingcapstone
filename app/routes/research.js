const ResearchDAO = require("../data/research-dao").ResearchDAO;
const needle = require("needle");
const {
    environmentalScripts
} = require("../../config/config");

// Fix for SSRF: the server decides the host; the user only supplies a validated stock symbol
const STOCK_URL = "https://finance.yahoo.com/q?s=";
const SYMBOL_RE = /^[A-Za-z0-9.\-]{1,10}$/;

function ResearchHandler(db) {
    "use strict";

    const researchDAO = new ResearchDAO(db);

    this.displayResearch = (req, res) => {

        if (req.query.symbol) {
            if (typeof req.query.symbol !== "string" || !SYMBOL_RE.test(req.query.symbol)) {
                return res.status(400).send("Invalid stock symbol");
            }

            const url = STOCK_URL + encodeURIComponent(req.query.symbol);
            return needle.get(url, (error, newResponse, body) => {
                if (!error && newResponse.statusCode === 200) {
                    res.writeHead(200, {
                        "Content-Type": "text/html"
                    });
                }
                res.write("<h1>The following is the stock information you requested.</h1>\n\n");
                res.write("\n\n");
                if (body) {
                    res.write(body);
                }
                return res.end();
            });
        }

        return res.render("research", {
            environmentalScripts
        });
    };

}

module.exports = ResearchHandler;
