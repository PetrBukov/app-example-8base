import React from 'react';
import gql from 'graphql-tag';
import { DateTime } from 'luxon';
import objectPath from 'object-path';
import { Query, compose } from 'react-apollo';

import { Card, Dropdown, Icon, Menu, Heading, Loader, Tag, Row, TableBuilder, NoData, withModal } from '@8base/boost';
import { FIELD_TYPE, DATE_FORMATS } from '@8base/utils';

import { ClientEditDialog } from '../clients/ClientEditDialog';
import { OrderCreateDialog } from '../orders/OrderCreateDialog';
import { OrderEditDialog } from '../orders/OrderEditDialog';
import { OrderDeleteDialog } from '../orders/OrderDeleteDialog';

const CLIENT_QUERY = gql`
  query GetClientById($id: ID!) {
    client(id: $id) {
      id
      createdAt
      updatedAt
      firstName
      lastName
      email
      phone
      birthday
      orders {
        items {
          id
          address
          deliveryDt
          comment
          status
          orderItems {
            items {
              id
              product {
                name
                price
              }
              quantity
            }
          }
        }
      }
    }
  }
`;

const CLIENT_TABLE_COLUMNS = [
  {
    name: 'email',
    title: 'Email',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.TEXT,
      fieldTypeAttributes: {
        format: 'UNFORMATTED',
      },
    },
  },
  {
    name: 'phone',
    title: 'Phone',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.TEXT,
      fieldTypeAttributes: {
        format: 'UNFORMATTED',
      },
    },
  },
  {
    name: 'birthday',
    title: 'Birthday',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.DATE,
      fieldTypeAttributes: {
        format: 'DATE',
      },
    },
  },
  {
    name: 'createdAt',
    title: 'Created At',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.DATE,
      fieldTypeAttributes: {
        format: 'DATE',
      },
    },
  },
  {
    name: 'updatedAt',
    title: 'Updated At',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.DATE,
      fieldTypeAttributes: {
        format: 'DATE',
      },
    },
  },
];

const ORDERS_TABLE_COLUMNS = [
  {
    name: 'deliveryDt',
    title: 'Delivery Date',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.DATE,
      fieldTypeAttributes: {
        format: 'DATE',
      },
    },
  },
  {
    name: 'address',
    title: 'Address',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.TEXT,
      fieldTypeAttributes: {
        format: 'UNFORMATTED',
      },
    },
  },
  {
    name: 'comment',
    title: 'Comment',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.TEXT,
      fieldTypeAttributes: {
        format: 'UNFORMATTED',
      },
    },
  },
  {
    name: 'status',
    title: 'Status',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.TEXT,
      fieldTypeAttributes: {
        format: 'UNFORMATTED',
      },
    },
  },
  {
    name: 'cost',
    title: 'Cost',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.NUMBER,
      fieldTypeAttributes: {
        format: 'UNFORMATTED',
      },
    },
  },
  {
    name: 'edit',
    title: '',
    width: '60px',
  },
];

const enhancer = compose(withModal);

const ClientCard = enhancer(
  class ClientCard extends React.PureComponent {
    getFullName = (firstName, lastName) => `${firstName} ${lastName}`;

    renderEdit = rowData => (
      <Dropdown defaultOpen={false}>
        <Dropdown.Head>
          <Icon name="More" size="sm" color="LIGHT_GRAY2" />
        </Dropdown.Head>
        <Dropdown.Body pin="right">
          {({ closeDropdown }) => (
            <Menu>
              <Menu.Item
                onClick={() => {
                  this.props.openModal('ORDER_EDIT_DIALOG_ID', { id: rowData.id });
                  closeDropdown();
                }}
              >
                Edit
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  this.props.openModal('ORDER_DELETE_DIALOG_ID', { id: rowData.id });
                  closeDropdown();
                }}
              >
                Delete
              </Menu.Item>
            </Menu>
          )}
        </Dropdown.Body>
      </Dropdown>
    );

    renderItems = (column, rowData, handler) => {
      const dataPath = column.name.split('.');
      const cellData = objectPath.get(rowData, dataPath) || '';

      if (column.meta.isList) {
        const itemsArray = cellData.items ? cellData.items : cellData;

        return (
          <Row style={{ flexWrap: 'wrap' }}>
            {itemsArray && itemsArray.map(item => !!item && <Tag color="LIGHT_GRAY2">{handler(item)}</Tag>)}
          </Row>
        );
      } else {
        return cellData && <div>{handler(cellData)}</div>;
      }
    };

    renderText = (column, rowData) => {
      return this.renderItems(column, rowData, item => item);
    };

    renderNumber = (column, rowData) => {
      return this.renderItems(column, rowData, item => Math.ceil(item * 100) / 100);
    };

    renderDate = (column, rowData) => {
      const dateFormat =
        column.meta.fieldTypeAttributes.format === DATE_FORMATS.DATE ? DateTime.DATE_SHORT : DateTime.DATETIME_SHORT;

      return this.renderItems(column, rowData, item => DateTime.fromISO(item).toLocaleString(dateFormat));
    };

    renderRelation = (column, rowData) => {
      const dataPath = column.name.split('.');

      if (column.meta.isList) {
        return objectPath.get(rowData, [...dataPath, 'count']) || '';
      } else {
        return objectPath.get(rowData, [...dataPath, '_description']) || '';
      }
    };

    renderCell = (column, rowData) => {
      if (column.name === 'edit') {
        return this.renderEdit(rowData);
      }

      switch (column.meta.fieldType) {
        case FIELD_TYPE.TEXT:
          return this.renderText(column, rowData);
        case FIELD_TYPE.NUMBER:
          return this.renderNumber(column, rowData);

        case FIELD_TYPE.DATE:
          return this.renderDate(column, rowData);

        case FIELD_TYPE.RELATION:
          return this.renderRelation(column, rowData);

        default:
          return null;
      }
    };

    openCreateOrderModal = () => {
      const { openModal } = this.props;
      openModal('ORDER_CREATE_DIALOG_ID');
    };

    renderCard = ({ data, loading }) => {
      if (loading) {
        return <Loader stretch />;
      }
      if (!data || !data.client) {
        return <NoData />;
      }

      const clientData = data.client;
      const { id, firstName, lastName, orders } = clientData;

      const ordersData = orders.items.map(order => {
        const cost = order.orderItems.items.reduce((total, orderItem) => {
          return total + orderItem.product.price;
        }, 0);
        return {
          ...order,
          cost,
        };
      });

      return (
        <Card padding="md" stretch>
          <Card.Header>
            <Heading type="h4" text={`${this.getFullName(firstName, lastName)}`} />
          </Card.Header>

          <ClientEditDialog />
          <OrderCreateDialog />
          <OrderEditDialog />
          <OrderDeleteDialog />

          <Card.Section padding="none">
            <TableBuilder
              data={[clientData]}
              columns={CLIENT_TABLE_COLUMNS}
              action="Edit Client"
              renderCell={this.renderCell}
              onActionClick={() => {
                this.props.openModal('CLIENT_EDIT_DIALOG_ID', { id });
              }}
            />
          </Card.Section>
          <Card.Section>
            <Heading type="h4" text={`${firstName}'s Orders`} />
          </Card.Section>
          <Card.Section padding="none">
            <TableBuilder
              data={ordersData}
              columns={ORDERS_TABLE_COLUMNS}
              action="Create Order"
              renderCell={this.renderCell}
              onActionClick={this.openCreateOrderModal}
            />
          </Card.Section>
        </Card>
      );
    };

    render() {
      const {
        computedMatch: {
          params: { clientId },
        },
      } = this.props;
      return (
        <Query query={CLIENT_QUERY} variables={{ id: clientId }}>
          {this.renderCard}
        </Query>
      );
    }
  }
);
// cjz2ho7g200oo01mj28qbf6e7

export { ClientCard };
