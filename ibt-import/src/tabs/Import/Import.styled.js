import styled from 'styled-components';

export const RootContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
`;

export const Pane = styled.div`
  display: flex;
`;

const CentrablePane = styled(Pane)`
  ${({centered}) => centered && `
    justify-content: center;
  `}
`;

export const RowPane = styled(CentrablePane)`
  flex-direction: row;
  flex: 1;
`;

export const TopPane = styled(CentrablePane)`
  padding: 10px;
  align-items: center;
`;

export const LeftPane = styled(Pane)`
  padding: 10px;
  min-width: 20%;
  max-width: 50%;
`;
export const RightPane = styled(Pane)`
  padding: 10px;
  flex: 1;
`;
export const SnapRight = styled.div`
  position: absolute;
  right: 0;
`;