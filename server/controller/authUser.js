const pool = require("../config/db");
const generateToken = require("../config/generateToken");
const { z } = require('zod');

const authUser = async (req, res) => {
  console.log("Login attempt received");
  const { SID, password,role } = req.body;


  const userExists = await pool.query(
    `select * from Login where SID='${SID}'`
  );

  if (userExists.rows.length) {

    if(userExists.rows[0].role !=role ){
      return res
       .status(401)
       .json({ success: false, message: `You don't have a permission as ${role}` });

     }

     const user = userExists.rows[0];
    const isValidPassword = await pool.query(
      `SELECT password = crypt('${password}', password) as valid FROM Login WHERE SID='${SID}'`
    );

    
    console.log(user);

    if (isValidPassword.rows[0].valid) {
      console.log("Password matched");
      res.status(201).json({
        role: user.role,
        SID: user.sid,
        token: generateToken(user.role),
        success: true
      });
      } else {
        console.log("error occure");
        return res.status(401).json({ success: false, message: "Invalid Password" });
      }
  } else
   return res
      .status(400)
      .json({ success: false, message: "Login failed User not found" });
};


const authRole = async (req, res) => {
  // console.log(req.body);
  const { SID ,role } = req.body;

  console.log(req.body);
  console.log("Reached authRole");

  try {
    const userExists = await pool.query(
      `select * from login where SID='${SID}'`
    );
    console.log(userExists.rows[0]);

    if (userExists.rows.length) {


      if(role == userExists.rows[0].role){
        res.status(201).json({
          
          SID: userExists.rows[0].sid,
          role:userExists.rows[0].role,
          token: generateToken(userExists.rows[0].role),
          success:true
        });

        console.log("Login Successful")
      }

      else{
        console.log(role);
        console.log(userExists.rows[0].role);

        return res
        .status(401)
        .json({ success: false, message: `You don't have a permission as ${role}` });

       }
    } else {
      return res
        .status(400)
        .json({ success: false, message: "User not found Please Login" });
    }
   } catch (err) {
    console.log(err);
    return res.status(400).json({ success: false, message: err });
  }
};

const viewProfile = async (req, res) => {
  try {
    const studentSID = req.query.SID; 
    // checking whether the SID is empty or not
    if((studentSID.length === 0)){
      return res.status(400).json({ message: 'SID is invalid' });
    }
    const personalResult = await pool.query(`SELECT * FROM Student_Personal WHERE SID = $1`, [studentSID]);
    
    // checking whether the personal info is existed in database or not for the given SID?
    if (personalResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student personal information not found!' });
    }
    const studentPersonal = personalResult.rows[0];
  
    const academicResult = await pool.query(`SELECT * FROM Student_Academic WHERE SID = $1`, [studentSID]);
    // checking whether the academic info is existed in database or not for the given SID?
    if (academicResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student academic information not found!' });
    }

    const studentAcademic = academicResult.rows[0];

    const profile = {
      SID: studentPersonal.sid,
      Sname: studentPersonal.sname,
      Fname: studentPersonal.fname,
      Mname: studentPersonal.mname,
      Bdate: studentPersonal.bdate,
      nationality: studentPersonal.nationality,
      gender: studentPersonal.gender,
      EmailId: studentPersonal.emailid,
      acadEmailID: studentAcademic.emailid,
      Emergency_no: studentPersonal.emergency_no,
      Addr_street: studentPersonal.addr_street,
      Addr_city: studentPersonal.addr_city,
      Addr_state: studentPersonal.addr_state,
      zipcode: studentPersonal.zipcode,
      program: studentAcademic.program,
      year: studentAcademic.year,
      admission_through: studentAcademic.admission_through,
      admission_rank: studentAcademic.admission_rank,
    };

    return res.status(200).json(profile);
  } catch (error) {
    // console.error('Error during fetching profile:', error);
    return res.status(500).json({ message: 'Internal server error occurred!!' });
  }
};

const editProfile = async (req, res) => {
  
  // Define schema for validation
  // Using zod library for validation process
  const {
    Sname, Fname, Mname, personalEmail, Emergency_no, Addr_street, Addr_city, Addr_state, Zipcode, studentId
  } = req.body;
  const schema = z.object({  
    Sname: z.string().min(1, { message: 'Student Name is required' }),// means this field has to be in string format and must be not empty
    Fname: z.string().min(1, { message: 'Father\'s name is required' }),// must be non empty
    Mname: z.string().min(1, { message: 'Mother\'s name is required' }),// must be non empty
    personalEmail: z.string().email({ error: 'Invalid email address' }),// checking the format of email
    Emergency_no: z.string().regex(/^[0-9]{10}$/, { message: 'Emergency number must be a valid 10-digit number' }),// validation for phone number, must be 10 character 
    Addr_street: z.string().min(1, { message: 'Street address is required' }),// must be non empty
    Addr_city: z.string().min(1, { message: 'City is required' }),// must be non empty
    Addr_state: z.string().min(1, { message: 'State is required' }),// must be non empty
    Zipcode: z.string().regex(/^[0-9]{6}$/, { message: 'Zipcode must be a valid 6-digit number' }),// zipcode validation, must be 6 character 
    studentId: z.string().min(1, { message: 'SID is required' }),// must be non empty
  });
  
  
  try {

    const validatedData = schema.parse(req.body);

    await pool.query('BEGIN');
    const sid = req.body.studentId;
    const personalResult = await pool.query(`SELECT * FROM Student_Personal WHERE SID = $1`, [sid]);
    // checking whether the input SID is existed in database or not?
    if (personalResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student is not registered, therefore data is not editable' });
    }

    // Updating to values
    const personalQuery = ` UPDATE Student_Personal SET sname = $1, fname = $2, mname = $3,emailId = $4,emergency_no= $5, addr_street = $6, addr_city = $7,  addr_state = $8, zipcode = $9 WHERE SID = $10`;
    const personalValues = [
      Sname, Fname, Mname, personalEmail, Emergency_no, Addr_street, Addr_city, Addr_state, Zipcode, studentId
    ];
    await pool.query(personalQuery, personalValues);

    await pool.query('COMMIT');
    res.status(200).json({ description: 'Values are updated successfully!!', message: 'OK' });

} catch (error) {

  await pool.query('ROLLBACK');

  // if the error is in validation process then executing the below line of code
   if (error instanceof z.ZodError) {
    const messages = error.errors.map((err) => err.message);
    return res.status(400).json({ error: messages });
  }
  
  // If the error occured during data fetching process
  if (error.code === '23503' || error.code === '23505') {
    res.status(400).json({ error: 'Error due to wrong input!!' });
  }else {
    res.status(500).json({ error: 'Internal Server Error!!' });
  }
}
};

module.exports = {
  authUser,
  viewProfile,
  editProfile,
  authRole
};

