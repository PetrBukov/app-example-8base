import React from 'react';
import styled from 'react-emotion';
import { matchPath } from 'react-router';
import { withRouter, Link as RouterLink } from 'react-router-dom';
import { Grid, Breadcrumbs as BoostBreadcrumbs, Link } from '@8base/boost';

const BREADCRUMBS_ROUTES = [
  {
    path: '/clients',
    component: () => 'Clients',
    matchOptions: { exact: true },
  },
  {
    path: '/orders',
    component: () => 'Orders',
    matchOptions: { exact: true },
  },
  {
    path: '/products',
    component: () => 'Products',
    matchOptions: { exact: true },
  },
  {
    path: '/clients/:clientId',
    component: () => 'Client',
    matchOptions: { exact: false },
  },
  {
    path: '/orders/:orderId',
    component: () => 'Order',
    matchOptions: { exact: false },
  },
];

const HeaderTag = styled(Grid.Box)({
  paddingLeft: '2rem',
});

const BreadcrumbsItem = props => <Link tagName={RouterLink} color="DARK_GRAY1" size="lg" {...props} />;

let Breadcrumbs = ({ location }) => (
  <HeaderTag area="breadcrumbs" justifyContent="center">
    <BoostBreadcrumbs
      pathname={location.pathname}
      routes={BREADCRUMBS_ROUTES}
      matchPath={matchPath}
      itemTagName={BreadcrumbsItem}
    />
  </HeaderTag>
);

Breadcrumbs = withRouter(Breadcrumbs);

export { Breadcrumbs };
