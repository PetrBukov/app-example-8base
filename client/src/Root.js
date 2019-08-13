import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import { ProtectedRoute } from './shared/components';
import { MainPlate, ContentPlate, Nav } from './components';
import { Auth } from './routes/auth';
/** __APP_PAGES_IMPORTS__ */
import { Products } from './routes/products';
import { Orders } from './routes/orders';
import { Clients } from './routes/clients';
import { ClientCard } from './routes/client';
import { Order } from './routes/order';

export const Root = () => (
  <Switch>
    <Route path="/auth" component={Auth} />
    <ProtectedRoute>
      <MainPlate>
        <Nav.Plate color="BLUE">
          {/** __APP_ROUTE_LINKS__ */}
          <Nav.Item icon="Group" to="/clients" label="Clients" />
          <Nav.Item icon="Contract" to="/orders" label="Orders" />
          <Nav.Item icon="Planet" to="/products" label="Products" />
        </Nav.Plate>
        <ContentPlate>
          <Switch>
            {/** __APP_ROUTES__ */}
            <ProtectedRoute exact path="/clients" component={Clients} />
            <ProtectedRoute exact path="/orders" component={Orders} />
            <ProtectedRoute exact path="/products" component={Products} />
            <ProtectedRoute path="/clients/:clientId" component={ClientCard} />
            <ProtectedRoute path="/orders/:orderId" component={Order} />
            <Redirect to="/clients" />
          </Switch>
        </ContentPlate>
      </MainPlate>
    </ProtectedRoute>
  </Switch>
);
