const pool = require("../config/db");

// Takes CID from the req params and sending back all the note links in JSON format.

const courseNotes = async (req, res) => {

    const { CID } = req.params;
    
    // Validate CID
    if (isNaN(CID) || Number(CID)<0 || !(Number.isInteger(Number(CID)))) {
        console.log('Invalid CID branch triggered');
        return res.status(400).json({ error: 'Invalid CID' });
    }
    else{
        console.log('valid CID branch triggered');
        try {
            // Query to fetch the note_links
            const { rows } = await pool.query('SELECT note_link FROM Notes WHERE CID = $1', [CID]);
    
            // If there are no entries then: 
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Notes are not found for this particular course' });
            }
    
            return res.json({ notes: rows });
        } catch (error) {
            // console.error('Error during querying the database:', error);
            return res.status(500).json({ error: 'Error in the server side!' });
        }
    }
    
};

module.exports = {courseNotes}
