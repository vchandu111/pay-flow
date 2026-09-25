import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { addBeneficiarySchema } from './beneficiaries.schemas.js';
import { addBeneficiaryHandler, deleteBeneficiaryHandler, listBeneficiariesHandler } from './beneficiaries.controller.js';

export const beneficiariesRouter = Router();

beneficiariesRouter.use(requireAuth);

beneficiariesRouter.get('/', listBeneficiariesHandler);
beneficiariesRouter.post('/', validate({ body: addBeneficiarySchema }), addBeneficiaryHandler);
beneficiariesRouter.delete('/:id', deleteBeneficiaryHandler);
