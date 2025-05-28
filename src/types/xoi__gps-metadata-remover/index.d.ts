declare module '@xoi/gps-metadata-remover' {
    type ReadFunction = (size: number, offset: number) => Promise<ArrayBuffer>;
    type WriteFunction = (data: ArrayBuffer, offset: number) => Promise<void>;
    type Options = {
        skipXMPRemoval?: boolean;
    };

    function removeLocation(
        path: string,
        read: ReadFunction,
        write: WriteFunction,
        options?: Options
    ): Promise<boolean>;

    export { removeLocation };
}