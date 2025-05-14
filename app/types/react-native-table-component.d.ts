declare module 'react-native-table-component' {
  import { TextStyle, ViewStyle } from 'react-native';
  
  interface TableProps {
    borderStyle?: ViewStyle;
    children?: React.ReactNode;
  }

  interface RowProps {
    data: string[];
    style?: ViewStyle;
    textStyle?: TextStyle;
    widthArr?: number[];
  }

  interface RowsProps {
    data: string[][];
    style?: ViewStyle;
    textStyle?: TextStyle;
    widthArr?: number[];
  }

  interface TableWrapperProps {
    style?: ViewStyle;
    children?: React.ReactNode;
  }

  interface ColProps {
    data: string[];
    style?: ViewStyle;
    textStyle?: TextStyle;
    width?: number;
  }

  export class Table extends React.Component<TableProps> {}
  export class Row extends React.Component<RowProps> {}
  export class Rows extends React.Component<RowsProps> {}
  export class TableWrapper extends React.Component<TableWrapperProps> {}
  export class Col extends React.Component<ColProps> {}
} 