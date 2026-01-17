import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';

const router = Router();

// Schedule emails
router.post('/schedule', EmailController.scheduleEmail);
router.post('/schedule-bulk', EmailController.scheduleBulkEmails);

// Get emails
router.get('/scheduled', EmailController.getScheduledEmails);
router.get('/sent', EmailController.getSentEmails);
router.get('/stats', EmailController.getEmailStats);
router.get('/sender/:email', EmailController.getEmailsBySender);
router.get('/:id', EmailController.getEmailById);

// Cancel email
router.delete('/:id', EmailController.cancelEmail);

export default router;