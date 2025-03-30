// 全局類型定義文件

// 解決模組導入錯誤
declare module 'next' {
  export * from 'next/types/index';
  export default any;
  
  // 添加 Metadata 類型
  export interface Metadata {
    title?: string;
    description?: string;
    keywords?: string | string[];
    authors?: Array<{ name: string; url?: string }>;
    creator?: string;
    publisher?: string;
    robots?: string;
    canonical?: string;
    openGraph?: {
      title?: string;
      description?: string;
      url?: string;
      siteName?: string;
      images?: Array<{
        url: string;
        width?: number;
        height?: number;
        alt?: string;
      }>;
      locale?: string;
      type?: string;
    };
    twitter?: {
      card?: string;
      site?: string;
      creator?: string;
      title?: string;
      description?: string;
      image?: string;
    };
    viewport?: string;
    icons?: {
      icon?: string | Array<{ url: string; sizes?: string; type?: string }>;
      shortcut?: string;
      apple?: string | Array<{ url: string; sizes?: string; type?: string }>;
    };
    themeColor?: string;
    manifest?: string;
    other?: Record<string, any>;
  }
  
  export function generateMetadata(): Metadata;
}

declare module 'next/link' {
  import { ComponentType, LinkHTMLAttributes } from 'react';
  
  export interface LinkProps extends LinkHTMLAttributes<HTMLAnchorElement> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
  }
  
  const Link: ComponentType<LinkProps>;
  export default Link;
}

declare module 'next/router' {
  export interface RouterProps {
    route: string;
    pathname: string;
    query: { [key: string]: string | string[] };
    asPath: string;
    push: (url: string, as?: string, options?: any) => Promise<boolean>;
    replace: (url: string, as?: string, options?: any) => Promise<boolean>;
    reload: () => void;
    back: () => void;
    prefetch: (url: string) => Promise<void>;
    beforePopState: (cb: (state: any) => boolean) => void;
    events: {
      on: (event: string, handler: (...args: any[]) => void) => void;
      off: (event: string, handler: (...args: any[]) => void) => void;
      emit: (event: string, ...args: any[]) => void;
    };
    isFallback: boolean;
  }
  
  export function useRouter(): RouterProps;
}

declare module 'next/head' {
  import { ComponentType, ReactNode } from 'react';
  
  export interface HeadProps {
    children: ReactNode;
  }
  
  const Head: ComponentType<HeadProps>;
  export default Head;
}

declare module 'next/image' {
  import { ComponentType, ImgHTMLAttributes } from 'react';
  
  export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    layout?: 'fixed' | 'intrinsic' | 'responsive' | 'fill';
    loader?: (resolverProps: any) => string;
    quality?: number | string;
    priority?: boolean;
    loading?: 'lazy' | 'eager';
    unoptimized?: boolean;
    objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
    objectPosition?: string;
    lazyBoundary?: string;
    blurDataURL?: string;
    placeholder?: 'blur' | 'empty';
  }
  
  const Image: ComponentType<ImageProps>;
  export default Image;
}

// 解決 MUI 相關錯誤
declare module '@mui/material' {
  export const Avatar: any;
  export const List: any;
  export const ListItem: any;
  export const ListItemAvatar: any;
  export const ListItemText: any;
  export const Typography: any;
  export const Paper: any;
  export const Divider: any;
  export const Card: any;
  export const CardContent: any;
  export const Chip: any;
  export const Grid: any;
  export const Box: any;
  export const ListItemIcon: any;
  export interface ButtonProps {
    variant?: 'text' | 'outlined' | 'contained';
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    size?: 'small' | 'medium' | 'large';
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    fullWidth?: boolean;
    disabled?: boolean;
    href?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }
  export const Button: React.FC<ButtonProps>;
  
  export interface TextFieldProps {
    variant?: 'standard' | 'filled' | 'outlined';
    label?: React.ReactNode;
    placeholder?: string;
    helperText?: React.ReactNode;
    error?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    multiline?: boolean;
    rows?: number;
    maxRows?: number;
    type?: string;
    value?: unknown;
    defaultValue?: unknown;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    InputProps?: object;
    InputLabelProps?: object;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }
  export const TextField: React.FC<TextFieldProps>;
  
  export interface CircularProgressProps {
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    size?: number | string;
    thickness?: number;
    variant?: 'determinate' | 'indeterminate';
    value?: number;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }
  export const CircularProgress: React.FC<CircularProgressProps>;
  
  export interface IconButtonProps {
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    disabled?: boolean;
    edge?: 'start' | 'end' | false;
    size?: 'small' | 'medium' | 'large';
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }
  export const IconButton: React.FC<IconButtonProps>;
  
  export interface CollapseProps {
    in?: boolean;
    timeout?: number | { enter?: number; exit?: number } | 'auto';
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }
  export const Collapse: React.FC<CollapseProps>;
  export const Tooltip: any;
  export const LinearProgress: any;
  export const Container: any;
  export const AppBar: any;
  export const Toolbar: any;
  export const Menu: any;
  export const MenuItem: any;
  export const Drawer: any;
  export const Tab: any;
  export const Tabs: any;
  export const Dialog: any;
  export const DialogTitle: any;
  export const DialogContent: any;
  export const DialogActions: any;
  export const FormControl: any;
  export const InputLabel: any;
  export const Select: any;
  export const FormHelperText: any;
  export const Switch: any;
  export const FormControlLabel: any;
  export const Snackbar: any;
  export const Alert: any;
  export const Backdrop: any;
  export const Badge: any;
  export const Breadcrumbs: any;
  export const Checkbox: any;
  export const Radio: any;
  export const RadioGroup: any;
  export const Slider: any;
  export const Stepper: any;
  export const Step: any;
  export const StepLabel: any;
  export const Table: any;
  export const TableBody: any;
  export const TableCell: any;
  export const TableContainer: any;
  export const TableHead: any;
  export const TableRow: any;
  export const TablePagination: any;
  export const Accordion: any;
  export const AccordionSummary: any;
  export const AccordionDetails: any;
  export const Autocomplete: any;
  export const Skeleton: any;
  export const Stack: any;
  export const Pagination: any;
  export const SpeedDial: any;
  export const SpeedDialAction: any;
  export const SpeedDialIcon: any;
  export const Fab: any;
  export const Modal: any;
  export const Popover: any;
  export const Popper: any;
  export const Portal: any;
  export const Rating: any;
  export const SvgIcon: any;
  export const SwipeableDrawer: any;
  export const ToggleButton: any;
  export const ToggleButtonGroup: any;
  export const Zoom: any;
  export const Fade: any;
  export const Grow: any;
  export const Slide: any;
}

declare module '@mui/icons-material' {
  export const Message: any;
  export const Person: any;
  export const Email: any;
  export const Phone: any;
  export const CalendarToday: any;
  export const Chat: any;
  export const SmartToy: any;
  export const Edit: any;
  export const Check: any;
  export const ExpandMore: any;
  export const ExpandLess: any;
  export const Info: any;
  export const Home: any;
  export const Dashboard: any;
  export const People: any;
  export const Settings: any;
  export const Notifications: any;
  export const Search: any;
  export const Menu: any;
  export const Close: any;
  export const Add: any;
  export const Delete: any;
  export const Save: any;
  export const Send: any;
  export const ArrowBack: any;
  export const ArrowForward: any;
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const MoreVert: any;
  export const Refresh: any;
  export const Favorite: any;
  export const FavoriteBorder: any;
  export const Star: any;
  export const StarBorder: any;
  export const Warning: any;
  export const Error: any;
  export const CheckCircle: any;
  export const Help: any;
  export const HelpOutline: any;
  export const Language: any;
  export const Translate: any;
  export const AccountCircle: any;
  export const Lock: any;
  export const LockOpen: any;
  export const Visibility: any;
  export const VisibilityOff: any;
  export const ExitToApp: any;
  export const CloudUpload: any;
  export const CloudDownload: any;
  export const AttachFile: any;
  export const Link: any;
  export const LinkOff: any;
  export const FilterList: any;
  export const Sort: any;
  export const Print: any;
  export const Share: any;
  export const Facebook: any;
  export const Twitter: any;
  export const Instagram: any;
  export const LinkedIn: any;
  export const YouTube: any;
  export const GitHub: any;
}

// 解決 Redux 相關錯誤
declare module '@reduxjs/toolkit' {
  export * from '@reduxjs/toolkit';
}

declare module 'react-redux' {
  export * from 'react-redux';
}

// 解決 Socket.io 相關錯誤
declare module 'socket.io-client' {
  export * from 'socket.io-client';
}

// 解決其他常見錯誤
declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

// 解決 CSS 模組錯誤
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// 解決 React 相關錯誤
declare module 'react' {
  import * as React from 'react';
  
  export = React;
  export as namespace React;
  
  export interface FC<P = {}> {
    (props: P): React.ReactElement | null;
    propTypes?: any;
    contextTypes?: any;
    defaultProps?: Partial<P>;
    displayName?: string;
  }
  
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }

  export type JSXElementConstructor<P> = ((props: P) => ReactElement | null) | (new (props: P) => Component<P, any>);
  export type Key = string | number;

  export type ReactNode = ReactElement | string | number | Iterable<ReactNode> | ReactPortal | boolean | null | undefined;
  export type ReactPortal = {
    key: Key | null;
    children: ReactNode;
    containerInfo: any;
    implementation: any;
  };

  export interface RefObject<T> {
    readonly current: T | null;
  }

  export type MutableRefObject<T> = {
    current: T;
  };

  export type Ref<T> = RefCallback<T> | RefObject<T> | null;
  export type RefCallback<T> = (instance: T | null) => void;

  export type DependencyList = ReadonlyArray<any>;
  export type EffectCallback = () => void | (() => void);

  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Reducer<S, A> = (prevState: S, action: A) => S;
  export type ReducerState<R extends Reducer<any, any>> = R extends Reducer<infer S, any> ? S : never;
  export type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<any, infer A> ? A : never;

  export interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
    displayName?: string;
  }

  export interface Provider<T> {
    (props: ProviderProps<T>): ReactElement | null;
  }

  export interface Consumer<T> {
    (props: ConsumerProps<T>): ReactElement | null;
  }

  export interface ProviderProps<T> {
    value: T;
    children?: ReactNode;
  }

  export interface ConsumerProps<T> {
    children: (value: T) => ReactNode;
  }

  export interface MemoExoticComponent<T extends ComponentType<any>> {
    (props: ComponentProps<T>): ReactElement | null;
    displayName?: string;
  }

  export interface ForwardRefExoticComponent<P> {
    (props: P): ReactElement | null;
    displayName?: string;
  }

  export interface LazyExoticComponent<T extends ComponentType<any>> {
    (props: ComponentProps<T>): ReactElement | null;
    displayName?: string;
  }

  export type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>;
  export type ComponentClass<P = {}, S = {}> = new (props: P) => Component<P, S>;
  export type FunctionComponent<P = {}> = (props: P) => ReactElement<any, any> | null;
  export type PropsWithoutRef<P> = Omit<P, 'ref'>;
  export type PropsWithRef<P> = P & { ref?: Ref<any> };
  export type RefAttributes<T> = {
    ref?: Ref<T>;
  };
  export type ComponentProps<T extends ComponentType<any>> = T extends ComponentType<infer P> ? P : never;

  export const Fragment: React.FC;
  export function useState<T>(initialState: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>];
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function useContext<T>(context: React.Context<T>): T;
  export function useReducer<R extends React.Reducer<any, any>, I>(
    reducer: R,
    initialArg: I,
    init?: (arg: I) => React.ReducerState<R>
  ): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>];
  export function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
  ): T;
  export function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined): T;
  export function useRef<T>(initialValue: T): React.MutableRefObject<T>;
  export function useImperativeHandle<T, R extends T>(
    ref: React.Ref<T> | undefined,
    init: () => R,
    deps?: React.DependencyList
  ): void;
  export function useLayoutEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function useDebugValue<T>(value: T, format?: (value: T) => any): void;
  export function useId(): string;
  export function createElement(
    type: string | React.FunctionComponent | React.ComponentClass,
    props?: any,
    ...children: React.ReactNode[]
  ): React.ReactElement;
  export function cloneElement(
    element: React.ReactElement,
    props?: any,
    ...children: React.ReactNode[]
  ): React.ReactElement;
  export function createContext<T>(defaultValue: T): React.Context<T>;
  export class Component<P = {}, S = {}> implements React.Component<P, S> {
    constructor(props: P, context?: any);
    setState<K extends keyof S>(
      state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null),
      callback?: () => void
    ): void;
    forceUpdate(callback?: () => void): void;
    render(): React.ReactNode;
    readonly props: Readonly<P>;
    state: Readonly<S>;
    context: any;
    refs: {
      [key: string]: React.ReactInstance;
    };
  }
  export class PureComponent<P = {}, S = {}> extends Component<P, S> {}
  export function memo<P extends object>(
    Component: React.FunctionComponent<P>,
    propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
  ): React.MemoExoticComponent<React.FunctionComponent<P>>;
  export function forwardRef<T, P = {}>(
    render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
  ): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>>;
  export function isValidElement(object: any): object is React.ReactElement;
  export const Children: {
    map<T, C>(children: C | C[], fn: (child: C, index: number) => T): T[];
    forEach<C>(children: C | C[], fn: (child: C, index: number) => void): void;
    count(children: any): number;
    only<C>(children: C): C extends any[] ? never : C;
    toArray<C>(children: C | C[]): C[];
  };
  export const Suspense: React.FC<{ fallback?: React.ReactNode; children?: React.ReactNode }>;
  export function lazy<T extends React.ComponentType<any>>(
    factory: () => Promise<{ default: T }>
  ): React.LazyExoticComponent<T>;
  export function startTransition(callback: () => void): void;
  export function useTransition(): [boolean, (callback: () => void) => void];
  export function useDeferredValue<T>(value: T): T;
  export function createRef<T>(): React.RefObject<T>;
}

declare module 'react-dom' {
  import * as ReactDOM from 'react-dom';
  
  export = ReactDOM;
  export as namespace ReactDOM;
  
  export const render: any;
  export const hydrate: any;
  export const createPortal: any;
  export const findDOMNode: any;
  export const unmountComponentAtNode: any;
  export const flushSync: any;
  export const version: string;
  
  export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: any;
}