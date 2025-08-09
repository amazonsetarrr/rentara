import { Router } from 'express';
import TenantController from '../controllers/tenantController';

const router = Router();
const tenantController = new TenantController();

export function setTenantRoutes(app) {
    app.use('/tenants', router);

    router.post('/', tenantController.createTenant.bind(tenantController));
    router.get('/:id', tenantController.getTenant.bind(tenantController));
    router.put('/:id', tenantController.updateTenant.bind(tenantController));
    router.delete('/:id', tenantController.deleteTenant.bind(tenantController));
}