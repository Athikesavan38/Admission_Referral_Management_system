'use strict';

const referralService = require('../services/referral.service');

const submitReferral = async (req, res, next) => {
  try {
    const photoFile = req.files?.photo?.[0];
    const docFiles  = req.files?.documents ?? [];
    const photoPath = photoFile ? `/uploads/photos/${photoFile.filename}` : null;
    const docPaths  = docFiles.map((f) => `/uploads/documents/${f.filename}`);

    const referral = await referralService.submitReferral(
      {
        ...req.body,
        photo:      photoPath,
        documents:  docPaths,
        gender:     req.body.gender,
        cutoffMark: req.body.cutoffMark || null,
      },
      req.user.userId
    );
    res.status(201).json(referral);
  } catch (err) { next(err); }
};

const getReferrals = async (req, res, next) => {
  try {
    const result = await referralService.getReferrals({
      userId: req.user.userId,
      role:   req.user.role,
      ...req.query,
    });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

const getReferralByAadhaar = async (req, res, next) => {
  try {
    const referral = await referralService.getReferralByAadhaar(req.params.aadhaar, req.user);
    res.status(200).json(referral);
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const referral = await referralService.updateReferralStatus({
      ...req.body,
      adminUser: req.user,
    });
    res.status(200).json(referral);
  } catch (err) { next(err); }
};

const exportCSV = async (req, res, next) => {
  try {
    const { stringify } = require('csv-stringify');
    const Referral = require('../models/Referral');

    // Build the same query filters as getReferrals (admin sees all)
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.course) query.course = new RegExp(req.query.course.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const columns = [
      { key: 'aadhaar',      header: 'aadhaar' },
      { key: 'studentName',  header: 'studentName' },
      { key: 'gender',       header: 'gender' },
      { key: 'phone',        header: 'phone' },
      { key: 'email',        header: 'email' },
      { key: 'parentsPhone', header: 'parentsPhone' },
      { key: 'institution',  header: 'institution' },
      { key: 'marks10',      header: 'marks10' },
      { key: 'marks12',      header: 'marks12' },
      { key: 'cutoffMark',   header: 'cutoffMark' },
      { key: 'course',       header: 'course' },
      { key: 'address',      header: 'address' },
      { key: 'country',      header: 'country' },
      { key: 'state',        header: 'state' },
      { key: 'city',         header: 'city' },
      { key: 'referredBy',   header: 'referredBy' },
      { key: 'referrerRole', header: 'referrerRole' },
      { key: 'timestamp',    header: 'timestamp' },
      { key: 'status',       header: 'status' },
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="referrals.csv"');

    const stringifier = stringify({ header: true, columns });
    stringifier.pipe(res);

    // Stream documents via cursor instead of loading all into memory
    const cursor = Referral.find(query)
      .populate('referredBy', 'name email role')
      .sort({ timestamp: -1 })
      .cursor();

    for await (const r of cursor) {
      stringifier.write({
        aadhaar:      r.aadhaar,
        studentName:  r.studentName,
        gender:       r.gender ?? '',
        phone:        r.contactDetails?.phone ?? '',
        email:        r.contactDetails?.email ?? '',
        parentsPhone: r.contactDetails?.parentsPhone ?? '',
        institution:  r.institution ?? '',
        marks10:      r.marks10 ?? '',
        marks12:      r.marks12 ?? '',
        cutoffMark:   r.cutoffMark ?? '',
        course:       r.course,
        address:      r.address ?? '',
        country:      r.country ?? '',
        state:        r.state ?? '',
        city:         r.city ?? '',
        referredBy:   r.referredBy?.name ?? '',
        referrerRole: r.referredBy?.role ?? '',
        timestamp:    r.timestamp ? r.timestamp.toISOString() : '',
        status:       r.status,
      });
    }

    stringifier.end();
  } catch (err) { next(err); }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const { filter, year } = req.query;
    const result = await referralService.getLeaderboard({ filter, year });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

module.exports = {
  submitReferral,
  getReferrals,
  getReferralByAadhaar,
  updateStatus,
  exportCSV,
  getLeaderboard,
};
