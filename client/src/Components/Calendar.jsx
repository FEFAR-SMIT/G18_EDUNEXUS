import * as React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';


export default function BasicDateCalendar() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar sx={{
        width:'100%',
        height:'100%'
      }}/>
    </LocalizationProvider>
  );
}
