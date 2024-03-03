const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const API_KEY = `sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912` ;

app.use(express.json());

app.get('/:formId/responses', async (req, res) => {
    const {formId} = req.params;

    const { page, pageSize, filters, limit = 2 } = req.query; // Set default values for limit, offset, and sort

    const compare = {
        equals: (a, b) => a === b,
        does_not_equal: (a, b) => a !== b,
        greater_than: (a, b) => new Date(a) > new Date(b), // Using Date for greater/less than comparisons
        less_than: (a, b) => new Date(a) < new Date(b),
    };

    let parsedFilters = {};
    try {
        parsedFilters = filters ? JSON.parse(filters) : [];
    } catch (error) {
        console.error("Error parsing filters:", error);
        return res.status(400).send({message: "Invalid filters format."});
    }

    const options = {
        method: 'GET',
        url: `https://api.fillout.com/v1/api/forms`,
        params: {formId},
        query: { limit, pageSize, filters },
        headers: {
            Authorization: `Bearer ${API_KEY}`
        }
    }
    try {
        const responses = await axios.request(options);


        const filteredResponses = responses.data.filter(response => {
            // Check each filter condition against each response object
            return parsedFilters.some(filter => {
                console.log(filter,'filter');

                const matchingEntry = Object.entries(response).find(([key, value]) => {
                    console.log(key, value, "key value")
                    console.log(compare[filter.condition](value, filter.value), 'compare');
                    // matching the key to the value and returning it if it matches
                    return   filter && compare[filter.condition](value, filter.value);
                });
                console.log(matchingEntry, 'matchingEntry')
                return matchingEntry;
            });

        });







        res.json({ responses: filteredResponses, totalResponses: filteredResponses.length });

    } catch (error) {
        console.error("Error fetching data from Fillout.com:", error.message);
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
        return res.status(500).send({ message: "An error occurred while processing the request." });
    }
});

    app.get('/:formId/filteredResponses', async (req, res) => {
    const { formId } = req.params;
    const { limit=2, offset=0,id,name,formID, filters } = req.query;
    const parsedFilters = JSON.parse(filters);

    try {
        const response = await axios.get(`https://api.fillout.com/${formId}/responses`, {
            headers: { Authorization: `Bearer ${API_KEY}` },
            params: { limit, offset, id, name, formID }
        });
console.log(response.data);


        // Assuming `response.data` is an array and `parsedFilters` is your array of conditions.

// First, validate the structure of `response.data`.
        if (!Array.isArray(response.data)) {
            return res.status(500).send({ message: "Unexpected API response structure." });
        }

// Then, filter `response.data`.
        let filteredResponses = response.data.filter(item => {
            // Ensure each item has a `questions` array.
            if (!item.questions || !Array.isArray(item.questions)) {
                // This item doesn't meet our criteria, so exclude it from the filtered results.
                return false;
            }

            // Check if every condition in `parsedFilters` is met.
            return parsedFilters.every(filter => {
                // Find the corresponding question.
                const question = item.questions.find(q => q.id === filter.id);

                // If the question isn't found, exclude this item.
                if (!question) return false;

                // Evaluate the condition for the found question.
                switch (filter.condition) {
                    case 'equals':
                        return question.value === filter.value;
                    case 'does_not_equal':
                        return question.value !== filter.value;
                    case 'greater_than':
                        // Assuming `question.value` and `filter.value` are comparable (e.g., numbers or date strings).
                        return new Date(question.value) > new Date(filter.value);
                    case 'less_than':
                        return new Date(question.value) < new Date(filter.value);
                    default:
                        // If the condition is unknown, exclude this item.
                        return false;
                }
            });
        });

// `filteredResponses` now contains the items that meet all conditions.
// You can proceed with using `filteredResponses` as needed.


        // Adjust totalResponses and pageCount based on filtering
        const totalResponses = filteredResponses.length;
        const pageCount = Math.ceil(totalResponses / pageSize);

        res.json({
            responses: filteredResponses,
            totalResponses,
            pageCount
        });
    } catch (error) {
        console.error("Error fetching data from Fillout.com:", error.message);
        if (error.response) {
            // Log or handle HTTP response code errors
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
        return res.status(500).send({ message: "An error occurred while processing the request." });
    }

});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
// Path: package.json