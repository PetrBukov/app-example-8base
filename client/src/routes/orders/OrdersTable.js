import React from 'react';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';
import objectPath from 'object-path';
import { withStateHandlers } from 'recompose';
import { compose, Query } from 'react-apollo';
import { DateTime } from 'luxon';
import * as R from 'ramda';
import { TableBuilder, Dropdown, Icon, Menu, Tag, Row, withModal } from '@8base/boost';
import { FIELD_TYPE, DATE_FORMATS, SWITCH_FORMATS, SWITCH_VALUES } from '@8base/utils';

const ORDERS_LIST_QUERY = gql`
  query OrdersTableContent(
    $filter: OrderFilter
    $orderBy: [OrderOrderBy]
    $after: String
    $before: String
    $first: Int
    $last: Int
    $skip: Int
  ) {
    ordersList(
      filter: $filter
      orderBy: $orderBy
      after: $after
      before: $before
      first: $first
      last: $last
      skip: $skip
    ) {
      items {
        id
        orderItems {
          items {
            product {
              price
            }
            quantity
          }
        }
        client {
          id
          _description
        }
        address
        deliveryDt
        comment
        status
        _description
      }
      count
    }
  }
`;

const TABLE_COLUMNS = [
  {
    name: 'client',
    title: 'Client',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.RELATION,
      fieldTypeAttributes: {
        format: '',
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
    name: 'deliveryDt',
    title: 'DeliveryDt',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.DATE,
      fieldTypeAttributes: {
        format: 'DATETIME',
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
      fieldType: FIELD_TYPE.SWITCH,
      fieldTypeAttributes: {
        format: 'CUSTOM',
      },
    },
  },
  {
    name: 'totalCost',
    title: 'Total Cost',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.TEXT,
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

const enhancer = compose(
  withModal,
  withRouter,
  withStateHandlers(
    { tableState: { pagination: { page: 1, pageSize: 20 } } },
    {
      onChange: ({ tableState }) => value => ({
        tableState: {
          ...tableState,
          ...value,
        },
      }),
    }
  )
);

const OrdersTable = enhancer(
  class OrdersTable extends React.PureComponent {
    renderEdit = rowData => (
      <Dropdown defaultOpen={false}>
        <Dropdown.Head>
          <Icon name="More" size="sm" color="LIGHT_GRAY2" />
        </Dropdown.Head>
        <Dropdown.Body pin="right">
          {({ closeDropdown }) => (
            <Menu>
              <Menu.Item onClick={() => this.props.history.push(`/orders/${rowData.id}`)}>Open</Menu.Item>
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

    renderScalar = (column, rowData) => {
      return this.renderItems(column, rowData, item => item);
    };

    renderDate = (column, rowData) => {
      const dateFormat =
        column.meta.fieldTypeAttributes.format === DATE_FORMATS.DATE ? DateTime.DATE_SHORT : DateTime.DATETIME_SHORT;

      return this.renderItems(column, rowData, item => DateTime.fromISO(item).toLocaleString(dateFormat));
    };

    renderSwitch = (column, rowData) => {
      if (column.meta.fieldTypeAttributes.format === SWITCH_FORMATS.CUSTOM) {
        return this.renderItems(column, rowData, item => item);
      } else {
        return this.renderItems(column, rowData, item => SWITCH_VALUES[column.meta.fieldTypeAttributes.format][item]);
      }
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
        case FIELD_TYPE.NUMBER:
          return this.renderScalar(column, rowData);

        case FIELD_TYPE.DATE:
          return this.renderDate(column, rowData);

        case FIELD_TYPE.SWITCH:
          return this.renderSwitch(column, rowData);

        case FIELD_TYPE.RELATION:
          return this.renderRelation(column, rowData);

        default:
          return null;
      }
    };

    openCreateModal = () => {
      const { openModal } = this.props;

      openModal('ORDER_CREATE_DIALOG_ID');
    };

    renderTable = ({ data, loading }) => {
      const { tableState, onChange } = this.props;
      const total = R.pathOr(null, ['ordersList', 'count'], data);

      const tableData = objectPath.get(data, ['ordersList', 'items']) || [];
      const finalTableState = R.assocPath(['pagination', 'total'], total, tableState);

      const finalTableData = tableData.map(order => {
        const totalCost = `$${Math.round(
          order.orderItems.items.reduce((sum, orderItem) => {
            return sum + orderItem.product.price * orderItem.quantity;
          }, 0) * 100
        ) / 100}`;
        return {
          ...order,
          totalCost,
        };
      });

      console.log('tableData', tableData);

      return (
        <TableBuilder
          loading={loading}
          data={finalTableData}
          columns={TABLE_COLUMNS}
          action="Create Order"
          renderCell={this.renderCell}
          onActionClick={this.openCreateModal}
          tableState={finalTableState}
          onChange={onChange}
          withPagination
        />
      );
    };

    render() {
      const { tableState } = this.props;

      const skip = (tableState.pagination.page - 1) * tableState.pagination.pageSize;
      const first = tableState.pagination.pageSize;
      const orderBy = R.propOr([], 'sort', tableState).map(({ name, order }) => `${name}_${order}`);

      return (
        <Query query={ORDERS_LIST_QUERY} variables={{ orderBy, skip, first }}>
          {this.renderTable}
        </Query>
      );
    }
  }
);

export { OrdersTable };
