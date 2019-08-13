import React from 'react';
import gql from 'graphql-tag';
import objectPath from 'object-path';
import { withStateHandlers } from 'recompose';
import { compose, Query } from 'react-apollo';
import { DateTime } from 'luxon';
import * as R from 'ramda';
import { TableBuilder, Dropdown, Icon, Menu, Link, Tag, Row, withModal } from '@8base/boost';
import { FIELD_TYPE, FILE_FORMATS, DATE_FORMATS } from '@8base/utils';

const PRODUCTS_LIST_QUERY = gql`
  query ProductsTableContent(
    $filter: ProductFilter
    $orderBy: [ProductOrderBy]
    $after: String
    $before: String
    $first: Int
    $last: Int
    $skip: Int
  ) {
    productsList(
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
        picture {
          id
          fileId
          filename
          downloadUrl
          shareUrl
          meta
        }
        name
        description
        price
        _description
      }
      count
    }
  }
`;

const TABLE_COLUMNS = [
  {
    name: 'picture',
    title: 'Picture',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.FILE,
      fieldTypeAttributes: {
        format: 'IMAGE',
      },
    },
  },
  {
    name: 'name',
    title: 'Name',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.TEXT,
      fieldTypeAttributes: {
        format: 'UNFORMATTED',
      },
    },
  },
  {
    name: 'description',
    title: 'Description',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.TEXT,
      fieldTypeAttributes: {
        format: 'UNFORMATTED',
      },
    },
  },
  {
    name: 'price',
    title: 'Price',
    meta: {
      isList: false,
      fieldType: FIELD_TYPE.NUMBER,
      fieldTypeAttributes: {
        format: 'NUMBER',
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

const ProductsTable = enhancer(
  class ProductsTable extends React.PureComponent {
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
                  this.props.openModal('PRODUCT_EDIT_DIALOG_ID', { id: rowData.id });
                  closeDropdown();
                }}
              >
                Edit
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  this.props.openModal('PRODUCT_DELETE_DIALOG_ID', { id: rowData.id });
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

    renderRelation = (column, rowData) => {
      const dataPath = column.name.split('.');

      if (column.meta.isList) {
        return objectPath.get(rowData, [...dataPath, 'count']) || '';
      } else {
        return objectPath.get(rowData, [...dataPath, '_description']) || '';
      }
    };

    renderFile = (column, rowData) => {
      if (column.meta.fieldTypeAttributes.format === FILE_FORMATS.IMAGE && !column.meta.isList) {
        const cellData = objectPath.get(rowData, column.name.split('.'));

        return cellData && <img src={cellData.downloadUrl} alt="filename" style={{ width: '5rem' }} />;
      } else {
        return this.renderItems(column, rowData, item => (
          <div>
            <Link key={item.downloadUrl} target="_blank" href={item.downloadUrl} size="sm">
              {item.filename}
            </Link>
          </div>
        ));
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

        case FIELD_TYPE.FILE:
          return this.renderFile(column, rowData);

        case FIELD_TYPE.RELATION:
          return this.renderRelation(column, rowData);

        default:
          return null;
      }
    };

    openCreateModal = () => {
      const { openModal } = this.props;

      openModal('PRODUCT_CREATE_DIALOG_ID');
    };

    renderTable = ({ data, loading }) => {
      const { tableState, onChange } = this.props;
      const total = R.pathOr(null, ['productsList', 'count'], data);

      const tableData = objectPath.get(data, ['productsList', 'items']) || [];
      const finalTableState = R.assocPath(['pagination', 'total'], total, tableState);

      return (
        <TableBuilder
          loading={loading}
          data={tableData}
          columns={TABLE_COLUMNS}
          action="Create Product"
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
        <Query query={PRODUCTS_LIST_QUERY} variables={{ orderBy, skip, first }}>
          {this.renderTable}
        </Query>
      );
    }
  }
);

export { ProductsTable };
