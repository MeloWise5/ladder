export const formatDate = (input) => {
  // Return empty string for blank or invalid inputs
  if (!input || input === '-' || input === '' || input === 0 || input === '0') {
    return '';
  }

  let date;

  if (typeof input === 'string' && input.includes('T') && input.endsWith('Z')) {
    date = new Date(input);
  } else if (typeof input === 'number') {
    date = new Date(input * 1000);
  } else if (typeof input === 'string' && !isNaN(parseFloat(input))) {
    // Handle Unix timestamp as string
    date = new Date(parseFloat(input) * 1000);
  } else {
    console.log('Invalid date format')
    return '';
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear() % 100;

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${month}/${day}/${year.toString().padStart(2, '0')} : ${hours}:${minutes}:${seconds}${ampm}`;
};