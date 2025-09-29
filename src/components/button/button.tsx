/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, {
  forwardRef,
  FunctionComponent,
  Ref,
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from 'react';
import classNames from 'classnames';

import {
  CommonProps,
  ExclusiveUnion,
  PropsForAnchor,
  PropsForButton,
  keysOf,
} from '../common';

import { getSecureRelForTarget } from '../../services';

import {
  OuiButtonContentProps,
  OuiButtonContentType,
  OuiButtonContent,
} from './button_content';
import { validateHref } from '../../services/security/href_validator';
import { Button } from '../../../components/ui/button';

export type ButtonColor =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ghost'
  | 'text';

export type ButtonSize = 's' | 'm';

export const colorToClassNameMap: { [color in ButtonColor]: string } = {
  primary: '--primary',
  accent: '--accent',
  secondary: '--secondary',
  success: '--success',
  warning: '--warning',
  danger: '--danger',
  ghost: '--ghost',
  text: '--text',
};

export const COLORS = keysOf(colorToClassNameMap);

export const sizeToClassNameMap: { [size in ButtonSize]: string | null } = {
  s: '--small',
  m: null,
};

export const SIZES = keysOf(sizeToClassNameMap);

// Helper function to map OuiButton props to shadcn Button props
const mapOuiButtonPropsToShadcn = (color: ButtonColor, fill: boolean) => {
  let variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'default';
  
  switch (color) {
    case 'primary':
      variant = fill ? 'default' : 'outline';
      break;
    case 'secondary':
    case 'accent':
      variant = fill ? 'secondary' : 'outline';
      break;
    case 'success':
      variant = fill ? 'default' : 'outline';
      break;
    case 'warning':
      variant = fill ? 'secondary' : 'outline';
      break;
    case 'danger':
      variant = fill ? 'destructive' : 'outline';
      break;
    case 'ghost':
      variant = 'ghost';
      break;
    case 'text':
      variant = 'link';
      break;
    default:
      variant = fill ? 'default' : 'outline';
  }
  
  return variant;
};

const mapOuiButtonSizeToShadcn = (size: ButtonSize): 'default' | 'sm' | 'lg' | 'icon' => {
  switch (size) {
    case 's':
      return 'sm';
    case 'm':
    default:
      return 'default';
  }
};

/**
 * Extends OuiButtonContentProps which provides
 * `iconType`, `iconSide`, `iconGap`, and `textProps`
 */
export interface OuiButtonProps extends OuiButtonContentProps, CommonProps {
  children?: ReactNode;
  /**
   * Make button a solid color for prominence
   */
  fill?: boolean;
  /**
   * Any of our named colors.
   * **`secondary` color is DEPRECATED, use `success` instead**
   */
  color?: ButtonColor;
  /**
   * Use size `s` in confined spaces
   */
  size?: ButtonSize;
  /**
   * `disabled` is also allowed
   */
  isDisabled?: boolean;
  /**
   * Applies the boolean state as the `aria-pressed` property to create a toggle button.
   * *Only use when the readable text does not change between states.*
   */
  isSelected?: boolean;
  /**
   * Extends the button to 100% width
   */
  fullWidth?: boolean;
  /**
   * Override the default minimum width
   */
  minWidth?: CSSProperties['minWidth'];
  /**
   * Force disables the button and changes the icon to a loading spinner
   */
  isLoading?: boolean;
  /**
   * Object of props passed to the <span/> wrapping the button's content
   */
  contentProps?: OuiButtonContentType;
  style?: CSSProperties;
}

export type OuiButtonDisplayProps = OuiButtonProps &
  HTMLAttributes<HTMLElement> & {
    /**
     * Provide a valid element to render the element as
     */
    element: 'a' | 'button' | 'span' | 'label';
    /**
     * Provide the component's base class name to build the class list on
     */
    baseClassName: string;
  };

/**
 * *INTERNAL ONLY*
 * Component for displaying any element as a button
 * OuiButton is largely responsible for providing relevant props
 * and the logic for element-specific attributes
 */
const OuiButtonDisplay = forwardRef<HTMLElement, OuiButtonDisplayProps>(
  (
    {
      element = 'button',
      baseClassName,
      children,
      className,
      iconType,
      iconGap = 'm',
      iconSide = 'left',
      color = 'primary',
      size = 'm',
      fill = false,
      isDisabled,
      isLoading,
      isSelected,
      contentProps,
      textProps,
      fullWidth,
      minWidth,
      style,
      ...rest
    },
    ref
  ) => {
    const buttonIsDisabled = isLoading || isDisabled;

    const classes = classNames(
      baseClassName,
      color ? `${baseClassName}${colorToClassNameMap[color]}` : null,
      size && sizeToClassNameMap[size]
        ? `${baseClassName}${sizeToClassNameMap[size]}`
        : null,
      fill && `${baseClassName}--fill`,
      fullWidth && `${baseClassName}--fullWidth`,
      buttonIsDisabled && `${baseClassName}-isDisabled`,
      className
    );

    /**
     * Not changing the content or text class names to match baseClassName yet,
     * as it is a major breaking change.
     */
    const contentClassNames = classNames(
      'ouiButton__content',
      contentProps && contentProps.className
    );

    const textClassNames = classNames(
      'ouiButton__text',
      textProps && textProps.className
    );

    const innerNode = (
      <OuiButtonContent
        isLoading={isLoading}
        iconType={iconType}
        iconSide={iconSide}
        iconGap={iconGap}
        textProps={{ ...textProps, className: textClassNames }}
        {...contentProps}
        // className has to come last to override contentProps.className
        className={contentClassNames}>
        {children}
      </OuiButtonContent>
    );

    let calculatedStyle: CSSProperties | undefined = style;
    if (minWidth !== undefined || minWidth !== null) {
      calculatedStyle = {
        ...calculatedStyle,
        minWidth,
      };
    }

    return React.createElement(
      element,
      {
        className: classes,
        style: calculatedStyle,
        disabled: element === 'button' && buttonIsDisabled,
        'aria-pressed': element === 'button' ? isSelected : undefined,
        ref,
        ...rest,
      },
      innerNode
    );
  }
);

OuiButtonDisplay.displayName = 'OuiButtonDisplay';
export { OuiButtonDisplay };

export type OuiButtonPropsForAnchor = PropsForAnchor<
  OuiButtonProps,
  {
    buttonRef?: Ref<HTMLAnchorElement>;
  }
>;

export type OuiButtonPropsForButton = PropsForButton<
  OuiButtonProps,
  {
    buttonRef?: Ref<HTMLButtonElement>;
  }
>;

export type Props = ExclusiveUnion<
  OuiButtonPropsForAnchor,
  OuiButtonPropsForButton
>;

export const OuiButton: FunctionComponent<Props> = ({
  isDisabled: _isDisabled,
  disabled: _disabled,
  href,
  target,
  rel,
  type = 'button',
  buttonRef,
  children,
  color = 'primary',
  size = 'm',
  fill = false,
  fullWidth,
  minWidth,
  style,
  className,
  isLoading,
  isSelected,
  contentProps,
  textProps,
  iconType,
  iconSide,
  iconGap,
  ...rest
}) => {
  const isHrefValid = !href || validateHref(href);
  const disabled = _disabled || !isHrefValid;
  const isDisabled = _isDisabled || !isHrefValid;

  const buttonIsDisabled = isLoading || isDisabled || disabled;
  
  const variant = mapOuiButtonPropsToShadcn(color, fill);
  const shadcnSize = mapOuiButtonSizeToShadcn(size);

  let calculatedStyle: CSSProperties | undefined = style;
  if (minWidth !== undefined || minWidth !== null) {
    calculatedStyle = {
      ...calculatedStyle,
      minWidth,
    };
  }
  if (fullWidth) {
    calculatedStyle = {
      ...calculatedStyle,
      width: '100%',
    };
  }

  // Clean up rest props to avoid spreading incompatible props
  const {
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    onClick,
    onBlur,
    onFocus,
  } = rest;

  const buttonProps = {
    ref: buttonRef as any, // Type assertion to handle ref compatibility
    variant,
    size: shadcnSize,
    disabled: buttonIsDisabled,
    className,
    style: calculatedStyle,
    'aria-pressed': isSelected,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    onClick: onClick as any,
    onBlur: onBlur as any,
    onFocus: onFocus as any,
  };

  if (href && !buttonIsDisabled) {
    return (
      <Button {...buttonProps} asChild>
        <a
          href={href}
          target={target}
          rel={getSecureRelForTarget({ href, target, rel })}
        >
          {children}
        </a>
      </Button>
    );
  }

  return (
    <Button {...buttonProps} type={type as 'button' | 'submit' | 'reset'}>
      {children}
    </Button>
  );
};

export type OuiSmallButtonProps = Omit<OuiButtonProps, 'size'>;

// Cannot Omit<Props, 'size'> directly due to Exclude changing optional prop types
type SmallProps = ExclusiveUnion<
  Omit<OuiButtonPropsForAnchor, 'size'>,
  Omit<OuiButtonPropsForButton, 'size'>
>;

export const OuiSmallButton: FunctionComponent<SmallProps> = (props) => (
  <OuiButton {...props} size="s" />
);
