'use strict';

const { stringify } = require('csv-stringify/sync');

/**
 * Generates a CSV string from an array of populated referral documents.
 *
 * @param {Array} referrals - populated Referral documents
 * @returns {string} CSV string
 */
const generateCSV = async (referrals) => {
  const records = referrals.map((r) => ({
    aadhaar:      r.aadhaar,
    studentName:  r.studentName,
    phone:        r.contactDetails?.phone ?? '',
    email:        r.contactDetails?.email ?? '',
    institution:  r.institution ?? '',
    marks10:      r.marks10 ?? '',
    marks12:      r.marks12 ?? '',
    course:       r.course,
    address:      r.address ?? '',
    country:      r.country ?? '',
    state:        r.state ?? '',
    city:         r.city ?? '',
    referredBy:   r.referredBy?.name ?? '',
    referrerRole: r.referredBy?.role ?? '',
    timestamp:    r.timestamp ? r.timestamp.toISOString() : '',
    status:       r.status,
  }));

  return stringify(records, {
    header: true,
    columns: [
      { key: 'aadhaar',      header: 'aadhaar' },
      { key: 'studentName',  header: 'studentName' },
      { key: 'phone',        header: 'phone' },
      { key: 'email',        header: 'email' },
      { key: 'institution',  header: 'institution' },
      { key: 'marks10',      header: 'marks10' },
      { key: 'marks12',      header: 'marks12' },
      { key: 'course',       header: 'course' },
      { key: 'address',      header: 'address' },
      { key: 'country',      header: 'country' },
      { key: 'state',        header: 'state' },
      { key: 'city',         header: 'city' },
      { key: 'referredBy',   header: 'referredBy' },
      { key: 'referrerRole', header: 'referrerRole' },
      { key: 'timestamp',    header: 'timestamp' },
      { key: 'status',       header: 'status' },
    ],
  });
};

module.exports = { generateCSV };
