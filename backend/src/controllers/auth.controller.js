'use strict';

const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.registerUser({ name, email, password, role });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginAdmin({ email, password });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

const loginUserOnly = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUserOnly({ email, password });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

module.exports = { register, login, loginAdmin, loginUserOnly };
