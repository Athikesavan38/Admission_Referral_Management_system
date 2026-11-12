'use strict';

const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

const submitReferralValidator = [
  body('aadhaar').matches(/^\d{12}$/).withMessage('Aadhaar must be exactly 12 digits'),
  body('studentName').notEmpty().withMessage('Student name is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender is required'),
  body('contactDetails.phone').matches(/^\d{10}$/).withMessage('Phone must be exactly 10 digits'),
  body('contactDetails.email').isEmail().withMessage('Valid email is required'),
  body('contactDetails.parentsPhone')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^\d{10}$/).withMessage('Parents phone must be exactly 10 digits'),
  body('institution').notEmpty().withMessage('School/Institution name is required'),
  body('marks10').notEmpty().withMessage('10th marks/percentage is required'),
  body('marks12').notEmpty().withMessage('12th marks/percentage is required'),
  body('cutoffMark').optional({ nullable: true, checkFalsy: true }),
  body('address').notEmpty().withMessage('Address is required'),
  body('country').notEmpty().withMessage('Country is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('course').notEmpty().withMessage('Course is required'),
  handleValidationErrors,
];

const updateStatusValidator = [
  body('aadhaar').notEmpty().withMessage('Aadhaar is required'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('remarks')
    .if(body('status').equals('rejected'))
    .notEmpty().withMessage('Remarks are required when rejecting a referral'),
  handleValidationErrors,
];

module.exports = { submitReferralValidator, updateStatusValidator };
