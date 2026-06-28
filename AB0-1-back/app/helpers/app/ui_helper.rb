module App
  module UiHelper
    def premium_badge(options = {})
      class_names = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-md ' \
                    'bg-gradient-to-r from-blue-700 to-blue-600 ' \
                    'text-white shadow-[0_4px_12px_-4px_rgba(29,78,216,0.6)] ' \
                    "select-none cursor-default #{options[:class]}"

      content_tag :div, class: class_names do
        svg = content_tag(:svg, viewBox: '0 0 24 24', class: 'w-3.5 h-3.5 fill-white',
                                xmlns: 'http://www.w3.org/2000/svg') do
          tag.path(d: 'M6 2L2 8l10 14L22 8l-4-6H6zM8.5 4h7l2 3h-11l2-3z')
        end
        span = content_tag(:span, 'PREMIUM', class: 'text-[10px] font-black tracking-widest')
        svg + span
      end
    end

    private

    def premium_diamond_icon
      content_tag :svg, viewBox: '0 0 24 24',
                        class: 'w-3 h-3 fill-current flex-shrink-0 drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]', xmlns: 'http://www.w3.org/2000/svg' do
        tag.path(d: 'M6 2L2 8l10 14L22 8l-4-6H6zM8.5 4h7l2 3h-11l2-3z')
      end
    end
  end
end
