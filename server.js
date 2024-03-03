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
                    console.log(compare[filter.condition], 'compare Stuff');
                    // matching the key to the value and returning it if it matches
                   if (!filter.id) return;
                   const result =filter && compare[filter.condition](value, filter.value);

                     return result;
                      // return key === filter.id && compare[filter.condition](value, filter.value);
                   // return   filter && compare[filter.condition(value, filter.value)];
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

// app.get('/:formId/responses', async (req, res) => {
//     const {formId} = req.params;
//
//     const { page, pageSize, filters, limit = 2 } = req.query; // Set default values for limit, offset, and sort
//
//     const compare = {
//         equals: (a, b) => a === b,
//         does_not_equal: (a, b) => a !== b,
//         greater_than: (a, b) => new Date(a) > new Date(b), // Using Date for greater/less than comparisons
//         less_than: (a, b) => new Date(a) < new Date(b),
//     };
//
//     let parsedFilters = {};
//     try {
//         parsedFilters = filters ? JSON.parse(filters) : [];
//     } catch (error) {
//         console.error("Error parsing filters:", error);
//         return res.status(400).send({message: "Invalid filters format."});
//     }
//
//     const options = {
//         method: 'GET',
//         url: `https://api.fillout.com/v1/api/forms`,
//         params: {formId},
//         query: { limit, pageSize, filters },
//         headers: {
//             Authorization: `Bearer ${API_KEY}`
//         }
//     }
//     try {
//         const responses = await axios.request(options);
//
//         const filteredResponses = responses.data.filter(response => {
//             // Check if any filter condition matches the response object
//             return parsedFilters.some(filter => {
//                 // Check if the response object has the property specified by filter.id
//                 if (!response.hasOwnProperty(filter.id)) {
//                     // If the property doesn't exist in the response, we consider this filter not matched
//                     return false;
//                 }
//
//                 // Get the value from the response object for the specified id
//                 const value = response[filter.id];
//
//                 // Dynamically invoke the comparison function based on the filter's condition
//                 // and compare the response's value against the filter's value
//                 const comparisonResult = compare[filter.condition](value, filter.value);
//                 console.log(`Comparing using ${filter.condition} between '${value}' and '${filter.value}': ${comparisonResult}`);
//
//                 // The logic here is inverted based on your description:
//                 // If the condition matches, we return false to exclude this response,
//                 // because you've indicated the filter should exclude matches.
//                 // If the condition does not match (comparisonResult is false), we return true to keep the item.
//                 return !comparisonResult;
//             });
//         });
//
//         // Since the logic inside `some` returns true for items to exclude,
//         // we actually need to negate the result to keep items that don't match any exclusion criteria.
//         // Therefore, we wrap the `some` call in a `!` to invert its logic for the final filter condition.
//         const finalResponses = filteredResponses.filter(response => !parsedFilters.some(filter => {
//             if (!response.hasOwnProperty(filter.id)) return false;
//             const value = response[filter.id];
//             return compare[filter.condition](value, filter.value);
//         }));
//
//         res.json({ responses: finalResponses, totalResponses: finalResponses.length });
//
//     } catch (error) {
//         console.error("Error fetching data from Fillout.com:", error.message);
//         if (error.response) {
//             console.error("Response status:", error.response.status);
//             console.error("Response data:", error.response.data);
//         }
//         return res.status(500).send({ message: "An error occurred while processing the request." });
//     }

});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
// Path: package.json